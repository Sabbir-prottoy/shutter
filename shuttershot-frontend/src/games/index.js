import TicTacToe from './TicTacToe'
import RockPaperScissors from './RockPaperScissors'
import MemoryMatch from './MemoryMatch'
import SnakeGame from './SnakeGame'
import Game2048 from './Game2048'
import WhackAMole from './WhackAMole'
import SimonSays from './SimonSays'
import NumberGuessing from './NumberGuessing'
import Hangman from './Hangman'
import ConnectFour from './ConnectFour'
import Minesweeper from './Minesweeper'
import ReactionTest from './ReactionTest'
import DiceRoll from './DiceRoll'
import WordScramble from './WordScramble'
import FlappyBird from './FlappyBird'
import PongGame from './PongGame'
import TypingTest from './TypingTest'

// Sidebar labels are deliberately just "Game-1".."Game-17", serially — the
// real title shows once a game is open, in the terminal header. Order below
// is a requested rearrangement (old #16->1, #15->2, #1->3, #17->5, #12->7,
// everything else keeps its original relative order filling the rest) —
// the "id" here is the new, re-synced serial position, not the old one.
export const GAMES = [
  {
    id: 1,
    title: 'Pong',
    Component: PongGame,
    instructions:
      "Move your mouse up and down over the board to control your paddle (left side). Keep the ball in play — first to 5 points wins. Click Start/Restart to begin.",
  },
  {
    id: 2,
    title: 'Flappy Bird',
    Component: FlappyBird,
    instructions:
      'Click the game area or press the spacebar to make the bird flap upward. Avoid the pipes and the floor/ceiling — each pipe you pass adds a point. Click again after crashing to restart.',
  },
  {
    id: 3,
    title: 'Tic-Tac-Toe',
    Component: TicTacToe,
    instructions:
      "Two players take turns clicking empty squares — X goes first, then O. Get three of your marks in a row (across, down, or diagonally) to win. Click 'New game' to reset the board.",
  },
  {
    id: 4,
    title: 'Rock Paper Scissors',
    Component: RockPaperScissors,
    instructions:
      'Pick Rock, Paper, or Scissors by clicking one of the icons. Rock beats Scissors, Scissors beats Paper, Paper beats Rock. Play as many rounds as you like — the score keeps counting.',
  },
  {
    id: 5,
    title: 'Typing Test',
    Component: TypingTest,
    instructions:
      "Type the sentence shown exactly as it appears, as fast as you can. Correct letters turn green, mistakes turn red. Your words-per-minute (WPM) is shown once you finish — click 'New sentence' to try another.",
  },
  {
    id: 6,
    title: 'Memory Match',
    Component: MemoryMatch,
    instructions:
      "Click any two cards to flip them. Matching pairs stay face-up; mismatches flip back after a moment. Match all pairs in as few moves as possible — click 'New game' to shuffle a fresh board.",
  },
  {
    id: 7,
    title: 'Reaction Test',
    Component: ReactionTest,
    instructions:
      "Click the box to begin. Wait for it to turn green, then click as fast as you can — clicking too early (while it's red) counts as a false start. Your reaction time in milliseconds is shown, along with your best.",
  },
  {
    id: 8,
    title: 'Snake',
    Component: SnakeGame,
    instructions:
      "Use the arrow keys to steer the snake toward the food (yellow square). Each bite grows the snake and adds to your score — avoid hitting the walls or your own tail. Click 'Start'/'Restart' to play again.",
  },
  {
    id: 9,
    title: '2048',
    Component: Game2048,
    instructions:
      'Use the arrow keys to slide every tile in one direction. Tiles with the same number merge into one, doubling its value. Keep merging to reach 2048 — the game ends when no more moves are possible.',
  },
  {
    id: 10,
    title: 'Whack-a-Mole',
    Component: WhackAMole,
    instructions:
      "Click 'Start' to begin a 20-second round. A mole randomly pops up in one of the 9 holes — click it quickly before it disappears to score a point.",
  },
  {
    id: 11,
    title: 'Simon Says',
    Component: SimonSays,
    instructions:
      "Click 'Start' and watch the colors light up in sequence, then repeat it by clicking the same colors in the same order. Each round adds one more step — see how long you can keep up.",
  },
  {
    id: 12,
    title: 'Number Guessing',
    Component: NumberGuessing,
    instructions:
      "A number between 1 and 100 has been picked at random. Enter a guess and submit — you'll be told to go higher or lower. Keep guessing until you find the exact number; fewer guesses is better.",
  },
  {
    id: 13,
    title: 'Hangman',
    Component: Hangman,
    instructions:
      'A photography-related word is hidden as blanks. Click letters to guess them — correct letters fill in the word, wrong guesses count against your 6 allowed misses. Guess the word before you run out of misses.',
  },
  {
    id: 14,
    title: 'Connect Four',
    Component: ConnectFour,
    instructions:
      'Two players take turns clicking a column to drop a piece (Red, then Yellow) — pieces stack from the bottom up. Connect four of your pieces in a row, horizontally, vertically, or diagonally, to win.',
  },
  {
    id: 15,
    title: 'Minesweeper',
    Component: Minesweeper,
    instructions:
      'Left-click a tile to reveal it — the number shows how many mines are in the surrounding 8 tiles. Right-click a tile to flag a suspected mine. Reveal every safe tile without clicking a mine to win.',
  },
  {
    id: 16,
    title: 'Dice Roll',
    Component: DiceRoll,
    instructions:
      "Pick whether the sum of two dice will be odd or even, then click 'Roll the dice'. Guess correctly to build a streak — see how long you can keep it going before a wrong guess resets it.",
  },
  {
    id: 17,
    title: 'Word Scramble',
    Component: WordScramble,
    instructions:
      "A photography-related word has been scrambled. Type your best guess and click 'Check' — get it right to score a point and move on, or click 'Skip word' to pass.",
  },
]
