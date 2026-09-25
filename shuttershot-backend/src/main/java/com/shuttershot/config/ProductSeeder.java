package com.shuttershot.config;

import com.shuttershot.model.Product;
import com.shuttershot.model.ProductCategory;
import com.shuttershot.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static com.shuttershot.model.ProductCategory.AUDIO_VIDEO;
import static com.shuttershot.model.ProductCategory.ESSENTIALS;
import static com.shuttershot.model.ProductCategory.EVERYDAY;
import static com.shuttershot.model.ProductCategory.LENSES;
import static com.shuttershot.model.ProductCategory.LIGHTING;
import static com.shuttershot.model.ProductCategory.SOFTWARE;
import static com.shuttershot.model.ProductCategory.STORAGE;
import static com.shuttershot.model.ProductCategory.SUPPORT;

// Stocks the Accessories Marketplace with a starting catalogue the first time the
// shop is empty. After that the admin "Manage Products" panel is the source of
// truth: prices, stock and items are edited there, never overwritten here.
// Prices are sample prices in whole BDT.
@Component
@Order(1)
@RequiredArgsConstructor
public class ProductSeeder implements ApplicationRunner {

    private static final String MOUNT_NOTE = " Available for Sony E, Canon RF and Nikon Z - tell us your mount in the order note.";
    private static final String DIGITAL_NOTE = " Activation details are sent to your email after your order is confirmed.";

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.saveAll(catalogue());
    }

    private static Product item(ProductCategory category, String name, String description, int price,
                                Integer oldPrice, int stock, boolean digital, String icon) {
        return Product.builder()
                .category(category)
                .name(name)
                .description(description)
                .price(price)
                .oldPrice(oldPrice)
                .stock(stock)
                .digital(digital)
                .iconKey(icon)
                .active(true)
                .build();
    }

    private static Product gear(ProductCategory category, String name, String description, int price,
                                Integer oldPrice, int stock, String icon) {
        return item(category, name, description, price, oldPrice, stock, false, icon);
    }

    private static Product digital(ProductCategory category, String name, String description, int price, String icon) {
        return item(category, name, description + DIGITAL_NOTE, price, null, 999, true, icon);
    }

    static List<Product> catalogue() {
        List<Product> all = new ArrayList<>();

        // ---- Camera essentials & care
        all.add(gear(ESSENTIALS, "Aluminium Travel Tripod with Ball Head",
                "160 cm tall, folds to 45 cm, holds 8 kg. Quick-release plate and carry bag included.", 6900, 8200, 14, "tripod"));
        all.add(gear(ESSENTIALS, "Camera Sling Bag",
                "Quick-access single-strap sling for a body, two lenses and accessories. Water-resistant fabric.", 3200, null, 22, "bag"));
        all.add(gear(ESSENTIALS, "Camera Backpack 25L",
                "Padded with adjustable dividers, a laptop sleeve, tripod straps and a built-in rain cover.", 5400, 6200, 15, "bag"));
        all.add(gear(ESSENTIALS, "SD Memory Card 128GB (V60)",
                "UHS-II, up to 250 MB/s read. Dependable for 4K video and fast burst shooting.", 3600, null, 60, "memory-card"));
        all.add(gear(ESSENTIALS, "SD Memory Card 128GB (V90)",
                "UHS-II, up to 300 MB/s read and 260 MB/s write. Built for 6K/8K video and pro burst rates.", 6900, 7800, 35, "memory-card"));
        all.add(gear(ESSENTIALS, "USB-C Multi-Card Reader (SD / microSD)",
                "Fast UHS-II transfers. Plug and play with laptops, tablets and phones.", 1450, null, 50, "card-reader"));
        all.add(gear(ESSENTIALS, "Extra Camera Battery (2000 mAh)",
                "Rechargeable Li-ion spare with a charge indicator. Tell us your camera model in the order note.", 2200, null, 40, "battery"));
        all.add(gear(ESSENTIALS, "Dual-Bay USB-C Battery Charger",
                "Charges two batteries at once with LED status lights. USB-C cable included.", 1850, null, 30, "charger"));
        all.add(gear(ESSENTIALS, "Rocket Air Blower (Large)",
                "Lifts dust off lenses and sensors without touching them. Soft silicone bulb.", 650, null, 80, "blower"));
        all.add(gear(ESSENTIALS, "Microfiber Cleaning Cloths (Pack of 5)",
                "Lint-free, scratch-safe cloths for lenses, screens and filters.", 450, null, 120, "cloth"));
        all.add(gear(ESSENTIALS, "Lens Cleaning Solution (60 ml)",
                "Streak-free, alcohol-free formula that is safe for coated optics.", 550, null, 70, "bottle"));
        all.add(gear(ESSENTIALS, "Sensor Cleaning Swabs (12 pcs, Full-frame)",
                "Pre-sized, individually wrapped swabs for full-frame sensors. Use with sensor cleaning fluid.", 2300, null, 25, "swab"));

        // ---- Lighting & filters
        all.add(gear(LIGHTING, "TTL Speedlight Flash (GN60)",
                "Powerful on-camera flash with TTL, high-speed sync and a tilt-and-swivel head.", 14500, 16800, 12, "flash"));
        all.add(gear(LIGHTING, "5-in-1 Reflector (110 cm)",
                "Translucent, silver, gold, white and black surfaces in one collapsible disc.", 1650, null, 45, "softbox"));
        all.add(gear(LIGHTING, "Portable LED Light Panel (Bi-colour)",
                "Rechargeable, 3200-5600K and dimmable. Clips on a hot shoe or mounts on a stand.", 5900, null, 18, "led-panel"));
        all.add(gear(LIGHTING, "Softbox 60 x 90 cm",
                "Collapsible rectangular softbox with an inner and outer diffuser and a carry bag.", 4800, null, 16, "softbox"));
        all.add(gear(LIGHTING, "Light Stand (2.8 m, Air-cushioned)",
                "Sturdy aluminium stand with air cushioning that folds down to 90 cm.", 3100, null, 24, "tripod"));
        all.add(gear(LIGHTING, "Translucent Umbrella (110 cm)",
                "Soft, wide light that flatters portraits. Fits standard flash brackets.", 950, null, 35, "softbox"));
        all.add(gear(LIGHTING, "Circular Polarizer (CPL) Filter 77 mm",
                "Cuts glare and reflections and deepens skies. Slim, multi-coated frame.", 3400, null, 20, "filter"));
        all.add(gear(LIGHTING, "Variable ND Filter 77 mm (ND2-ND400)",
                "Shoot wide open in bright light or slow the shutter for silky water.", 4200, 4900, 17, "filter"));
        all.add(gear(LIGHTING, "UV / Clear Protection Filter 77 mm",
                "Keeps your front element safe from dust, rain and scratches.", 1200, null, 55, "filter"));
        all.add(gear(LIGHTING, "Lens Hood (Petal, Universal Fit)",
                "Reduces flare and adds bump protection. Tell us your lens model in the order note.", 800, null, 50, "lens"));

        // ---- Lenses & optics
        all.add(gear(LENSES, "50mm f/1.8 Prime Lens",
                "Fast, sharp and light - a wedding and portrait favourite in low light." + MOUNT_NOTE, 18500, null, 9, "lens"));
        all.add(gear(LENSES, "85mm f/1.8 Portrait Lens",
                "Flattering compression and creamy background blur for portraits." + MOUNT_NOTE, 48000, 52500, 5, "lens"));
        all.add(gear(LENSES, "24-70mm f/2.8 Zoom Lens",
                "The standard pro zoom for weddings, events and everything in between." + MOUNT_NOTE, 115000, null, 3, "lens"));
        all.add(gear(LENSES, "70-200mm f/2.8 Telephoto Lens",
                "Constant f/2.8 telephoto for ceremonies, sports and wildlife." + MOUNT_NOTE, 135000, null, 3, "lens"));
        all.add(gear(LENSES, "Macro Close-up Filter Set (+1/+2/+4/+10)",
                "Turn any lens into a close-up lens - ideal for rings, details and flowers.", 1900, null, 30, "filter"));
        all.add(gear(LENSES, "Extension Tube Set (3-piece)",
                "Focus closer with the lenses you already own. Auto-focus contacts included." + MOUNT_NOTE, 3600, null, 14, "lens"));
        all.add(gear(LENSES, "2x Teleconverter",
                "Doubles your reach. Works with selected telephoto lenses - tell us your lens in the order note.", 16500, null, 6, "lens"));

        // ---- Support & stabilisation
        all.add(gear(SUPPORT, "Carbon Fibre Monopod (5-section)",
                "Lightweight support for events and sports. Folds to 52 cm with a padded grip.", 4900, null, 15, "tripod"));
        all.add(gear(SUPPORT, "3-Axis Handheld Gimbal Stabilizer",
                "Smooth video for weddings and events. Up to 3 kg payload and a 12-hour battery.", 22500, 25900, 8, "gimbal"));
        all.add(gear(SUPPORT, "Universal L-Bracket",
                "Switch between landscape and portrait without re-levelling the head.", 3200, null, 18, "rig"));
        all.add(gear(SUPPORT, "Quick-Release Plate (Arca-Swiss)",
                "Machined aluminium plate with a safety stop and a strap slot.", 1150, null, 40, "rig"));
        all.add(gear(SUPPORT, "Camera Bean Bag (Pre-filled)",
                "A steady, low-angle rest for a car window, a rock or the ground.", 1300, null, 25, "pouch"));
        all.add(gear(SUPPORT, "Padded Tripod Carry Strap",
                "Shoulder strap with a padded pad and quick clips to carry a tripod comfortably.", 750, null, 30, "strap"));

        // ---- Storage, protection & control
        all.add(gear(STORAGE, "Portable SSD 1TB (1050 MB/s)",
                "Pocket-sized, shock-resistant and quick enough to edit straight from the drive.", 13500, 15200, 20, "drive"));
        all.add(gear(STORAGE, "External Hard Drive 2TB (USB 3.0)",
                "Roomy backup storage for a season of weddings and events.", 7900, null, 26, "drive"));
        all.add(gear(STORAGE, "Gaffer Tape (48 mm x 25 m, Black)",
                "Cloth tape that leaves no residue - cables, flags and quick fixes.", 850, null, 60, "tape"));
        all.add(gear(STORAGE, "Camera Rain Cover (Universal)",
                "Keeps camera and lens dry in rain and spray, with a clear view of the controls.", 1100, null, 34, "bag"));
        all.add(gear(STORAGE, "Neoprene Lens Pouch (Medium)",
                "Padded, zippered pouch for a lens or flash. Fits standard prime and mid-size zooms.", 650, null, 45, "pouch"));
        all.add(gear(STORAGE, "Colour Checker Card (24-patch)",
                "Get true-to-life colour in every lighting setup with a reference target.", 6200, null, 10, "color-swatch"));
        all.add(gear(STORAGE, "Grey Card Set (18% grey, 3 sizes)",
                "Set exposure and white balance accurately every time.", 750, null, 50, "color-swatch"));
        all.add(gear(STORAGE, "Wireless Remote Shutter Release",
                "Fire the shutter from up to 30 m. Bulb and interval modes. Tell us your camera model.", 1600, null, 28, "remote"));
        all.add(gear(STORAGE, "Intervalometer Timer Remote",
                "Time-lapse and long exposures with programmable intervals. Tell us your camera model.", 2800, null, 16, "remote"));
        all.add(gear(STORAGE, "Battery Grip (Two-battery)",
                "Doubles your shooting time and adds a vertical shutter. Tell us your camera model.", 6800, null, 9, "battery"));

        // ---- Audio & video
        all.add(gear(AUDIO_VIDEO, "On-Camera Microphone (Stereo)",
                "Clear stereo sound straight into the camera. Shock mount and windscreen included.", 4500, null, 20, "microphone"));
        all.add(gear(AUDIO_VIDEO, "Lavalier Microphone (Wired, 6 m)",
                "Clip-on mic for speeches and vows with a 6 m cable.", 2900, null, 26, "microphone"));
        all.add(gear(AUDIO_VIDEO, "Shotgun Microphone (Directional)",
                "Focused pickup that cuts room noise. Ideal for interviews and ceremonies.", 8900, 9800, 12, "microphone"));
        all.add(gear(AUDIO_VIDEO, "Portable Audio Recorder (4-track)",
                "Record clean audio separately for perfect sync. XLR inputs and phantom power.", 15500, null, 7, "recorder"));
        all.add(gear(AUDIO_VIDEO, "5.5-inch HDMI Monitor (4K)",
                "Bright on-camera monitor with focus peaking, false colour and waveform.", 21000, null, 6, "led-panel"));
        all.add(gear(AUDIO_VIDEO, "Camera Cage / Rig Kit",
                "Adds mounting points for mics, lights and monitors, with a top handle.", 5600, null, 11, "rig"));
        all.add(gear(AUDIO_VIDEO, "Follow Focus (Geared)",
                "Smooth, repeatable focus pulls with adjustable hard stops.", 9800, null, 5, "rig"));
        all.add(gear(AUDIO_VIDEO, "Matte Box (Clip-on)",
                "Blocks flare and takes filters and flags for a cinematic look.", 7400, null, 6, "rig"));

        // ---- Software, backup & business
        all.add(digital(SOFTWARE, "Adobe Lightroom (1-year plan)",
                "Organise, edit and share photos on desktop and mobile.", 14500, "software"));
        all.add(digital(SOFTWARE, "Adobe Photoshop (1-year plan)",
                "Advanced retouching, compositing and design for finished images.", 28000, "software"));
        all.add(digital(SOFTWARE, "Capture One Pro (1-year plan)",
                "Professional raw editing with best-in-class tethered shooting.", 21500, "software"));
        all.add(gear(SOFTWARE, "Portable Hard Drive 1TB (Backup)",
                "Compact backup drive for a second copy of every shoot. USB 3.0.", 5900, null, 30, "drive"));
        all.add(digital(SOFTWARE, "Cloud Storage 2TB (1-year plan)",
                "Automatic off-site backup and sharing for your best work.", 12000, "cloud"));
        all.add(digital(SOFTWARE, "HoneyBook Client Management (1-year plan)",
                "Contracts, invoices and bookings in one place for your photography business.", 20000, "software"));
        all.add(digital(SOFTWARE, "Pixieset Client Gallery (1-year plan)",
                "Beautiful online galleries with downloads and a print store.", 12500, "software"));
        all.add(gear(SOFTWARE, "Calibrite Colour Calibrator",
                "Calibrate your monitor so edits look the same everywhere they are shown.", 19500, null, 5, "color-swatch"));

        // ---- Everyday carry
        all.add(gear(EVERYDAY, "Business Cards (Pack of 250, printed)",
                "Premium 350 gsm cards. Send your name, contact details and design notes in the order note.", 1200, null, 100, "business-cards"));
        all.add(gear(EVERYDAY, "Camera Strap (Padded Neoprene)",
                "Comfortable shoulder strap with a quick-release connector.", 1400, null, 40, "strap"));
        all.add(gear(EVERYDAY, "Lens Cap Keeper (Pack of 3)",
                "Keeps your lens cap on a cord instead of in the grass.", 150, null, 100, "strap"));
        all.add(gear(EVERYDAY, "Silica Gel Packs (Pack of 10)",
                "Absorb moisture in your camera bag to protect gear in humid weather.", 350, null, 90, "bottle"));
        all.add(gear(EVERYDAY, "Pocket Multi-Tool",
                "Pliers, screwdrivers and a blade - the small fixes every shoot needs.", 1800, null, 30, "multitool"));
        all.add(gear(EVERYDAY, "LED Headlamp / Flashlight",
                "Hands-free light for setup in the dark. Rechargeable with a red-light mode.", 1250, null, 45, "headlamp"));

        return all;
    }
}
