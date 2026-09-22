/**
 * Renders the small slice of markdown the assistant actually produces —
 * headings, bullet and numbered lists, **bold**, and `code`.
 *
 * Deliberately builds React elements instead of setting innerHTML: the text
 * comes from a language model, so treating it as HTML would hand any prompt
 * injection a script tag on our own origin.
 */

function renderInline(text, keyPrefix) {
  // Split on **bold** and `code`, keeping the delimiters so they can be styled.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-surface-raised px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{part}</span>
  })
}

export default function ChatMarkdown({ content }) {
  const lines = String(content ?? '').split('\n')
  const blocks = []
  let list = null

  const flushList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd()
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/)
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/)
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/)

    if (bullet) {
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bullet[1])
      return
    }

    if (numbered) {
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(numbered[2])
      return
    }

    flushList()

    if (heading) {
      blocks.push({ type: 'h', text: heading[1], key: index })
    } else if (line.trim()) {
      blocks.push({ type: 'p', text: line, key: index })
    }
  })
  flushList()

  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === 'ul' || block.type === 'ol') {
          const ListTag = block.type
          return (
            <ListTag
              key={`list-${index}`}
              className={`ml-5 space-y-1 ${block.type === 'ol' ? 'list-decimal' : 'list-disc'}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `${index}-${itemIndex}`)}</li>
              ))}
            </ListTag>
          )
        }
        if (block.type === 'h') {
          return (
            <p key={`h-${index}`} className="font-display text-base font-bold text-ink">
              {renderInline(block.text, `h-${index}`)}
            </p>
          )
        }
        return <p key={`p-${index}`}>{renderInline(block.text, `p-${index}`)}</p>
      })}
    </div>
  )
}
