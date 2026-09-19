export interface RoomTypeConfig {
  id: string;
  name: string;
  description: string;
  iconName: string;
  specificSections: {
    id: string;
    label: string;
    options: { id: string; label: string; promptModifier: string }[];
  }[];
}

export const COMMON_STYLES = [
  { id: 'japandi', label: 'Japandi (Warm Minimalist)', prompt: 'Japandi architectural style combining Scandinavian modern functionality and Japanese rustic minimalism, warm wood tones, organic textures, low profile furnishings' },
  { id: 'modern-minimalist', label: 'Modern Minimalist', prompt: 'Sleek modern minimalist interior design, clean geometric lines, clutter-free surfaces, refined architectural details' },
  { id: 'scandinavian', label: 'Scandinavian Hygge', prompt: 'Nordic Scandinavian interior design with bright airy atmosphere, light blonde woods, cozy textiles, functional elegance' },
  { id: 'mid-century', label: 'Mid-Century Modern', prompt: 'Mid-century modern design featuring iconic tapered leg furnishings, warm teak and walnut finishes, organic curves and retro sophistication' },
  { id: 'industrial-loft', label: 'Warm Industrial Loft', prompt: 'Warm industrial loft aesthetic with exposed brick or concrete textures, blackened steel accents, reclaimed wood and architectural statement pieces' },
  { id: 'coastal-contemporary', label: 'Coastal Contemporary', prompt: 'Breezy coastal contemporary aesthetic, soft nautical linen neutrals, light bleached oak, expansive natural light and ocean-inspired calmness' },
  { id: 'luxury-transitional', label: 'Luxury Transitional', prompt: 'High-end luxury transitional interior, tailored millwork, refined molding, plush velvet and bouclé textiles, timeless architectural balance' },
  { id: 'modern-farmhouse', label: 'Modern Farmhouse Chic', prompt: 'Modern farmhouse style featuring warm timber beams, board-and-batten accents, wrought iron fixtures and cozy rustic warmth' },
  { id: 'parisian-chic', label: 'Parisian Haussmann Chic', prompt: 'Parisian Haussmann apartment style with ornate herringbone parquet, intricate crown moldings, high ceilings and sculptural contemporary art' }
];

export const COLOR_PALETTES = [
  { id: 'warm-cream', label: 'Warm Cream & Sandstone', prompt: 'warm cream, ivory, soft taupe, and natural sandstone color palette' },
  { id: 'crisp-white', label: 'Crisp White & Light Oak', prompt: 'crisp gallery white walls accented with warm natural light oak wood tones' },
  { id: 'sage-earth', label: 'Sage Green & Earthy Olive', prompt: 'calming sage green walls, earthy muted olive accents, and brushed warm brass' },
  { id: 'moody-charcoal', label: 'Moody Charcoal & Deep Walnut', prompt: 'sophisticated moody charcoal accent walls, deep rich walnut woodwork, and atmospheric contrast' },
  { id: 'terracotta-clay', label: 'Terracotta & Warm Ochre', prompt: 'earthy terracotta, warm ochre, Mediterranean clay tones, and raw linen' },
  { id: 'soft-greyscale', label: 'Soft Monochromatic Greyscale', prompt: 'refined monochromatic light-to-mid grey tones with rich textural variation' }
];

export const FLOORING_OPTIONS = [
  { id: 'herringbone-oak', label: 'Herringbone White Oak Parquet', prompt: 'flooring replaced with elegant French herringbone pattern white oak hardwood' },
  { id: 'wide-plank-oak', label: 'Wide Plank Natural European Oak', prompt: 'flooring updated with wide-plank natural matte European oak timber' },
  { id: 'polished-concrete', label: 'Polished Architectural Concrete', prompt: 'flooring transformed to seamless large-format polished light concrete' },
  { id: 'calacatta-marble', label: 'Calacatta Gold Marble Tiles', prompt: 'flooring upgraded to luxurious large Calacatta gold marble tiles with subtle veining' },
  { id: 'dark-walnut', label: 'Smoked Walnut Chevron Hardwood', prompt: 'flooring finished in rich smoked dark walnut hardwood with satin seal' },
  { id: 'terrazzo', label: 'Artisanal Light Terrazzo', prompt: 'flooring with bespoke Italian light terrazzo with warm neutral stone aggregates' }
];

export const LIGHTING_OPTIONS = [
  { id: 'sunlit-daylight', label: 'Sun-Drenched Natural Daylight', prompt: 'illuminated by abundant natural morning sunlight streaming through sheer linen curtains' },
  { id: 'warm-ambient', label: 'Warm Cove & Sconce Lighting', prompt: 'layered with warm 2700K ambient cove ceiling lighting, architectural wall sconces, and soft glow' },
  { id: 'statement-chandelier', label: 'Sculptural Modern Chandelier', prompt: 'featuring a dramatic modern sculptural branch or geometric chandelier as an architectural centerpiece' },
  { id: 'golden-hour', label: 'Golden Hour Sunset Glow', prompt: 'bathed in dramatic golden hour evening sunlight with long cinematic shadows and rich warmth' },
  { id: 'mood-evening', label: 'Intimate Evening Mood Lighting', prompt: 'intimate evening architectural mood lighting with pinpoint recessed spots and accent glow' }
];

export const TRANSFORMATION_MODES = [
  { 
    id: 'restyle', 
    label: 'Restyle & Refurnish', 
    description: 'Keep existing walls and room layout; replace and upgrade all furniture, textiles, lighting, and decor',
    promptPrefix: 'Carefully preserve the exact architectural room dimensions, wall layout, door and window positions of the original photo. Replace all dated furniture, textiles, decor, and lighting with high-end furnishings matching the selected aesthetic.'
  },
  { 
    id: 'full-renovation', 
    label: 'Full Remodel & Architectural Overhaul', 
    description: 'Complete gut renovation: replace flooring, wall finishes, cabinetry, lighting, and structural materials',
    promptPrefix: 'Execute a comprehensive architectural remodel of this room space. Keep the general perspective and camera angle, but completely transform and upgrade all flooring, wall paneling, ceiling treatments, cabinetry, and fixtures.'
  },
  { 
    id: 'cosmetic-facelift', 
    label: 'Cosmetic Facelift & Styling', 
    description: 'Fresh wall paint, new lighting fixtures, rugs, plants, and contemporary art accents',
    promptPrefix: 'Perform an elegant cosmetic refresh of the room. Retain major structural items while revamping the wall paint colors, upgrading lighting fixtures, adding lush greenery, fresh area rugs, and curated modern art.'
  }
];

export const ROOM_TYPES: RoomTypeConfig[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    description: 'Lounge, family room, sitting area',
    iconName: 'Sofa',
    specificSections: [
      {
        id: 'seating',
        label: 'Seating & Sofa',
        options: [
          { id: 'boucle-curved', label: 'Curved Bouclé Sectional', promptModifier: 'low-profile curved off-white textured bouclé sectional sofa' },
          { id: 'leather-cognac', label: 'Cognac Leather Lounge Chairs & Sofa', promptModifier: 'deep cognac brown aniline leather seating with blackened steel frames' },
          { id: 'linen-tailored', label: 'Minimalist Belgian Linen Sofa', promptModifier: 'relaxed tailored Belgian natural linen sofa with feather-down cushions' },
          { id: 'modular-velvet', label: 'Low Modular Velvet Lounge', promptModifier: 'luxurious low-profile modular velvet seating in forest green or taupe' }
        ]
      },
      {
        id: 'feature-wall',
        label: 'Feature Wall / Fireplace',
        options: [
          { id: 'slat-wood-media', label: 'Wood Slat Wall with Floating Console', promptModifier: 'acoustic vertical fluted oak wood slat feature wall with a floating low-profile media console' },
          { id: 'linear-fireplace', label: 'Modern Linear Electric Fireplace', promptModifier: 'sleek integrated linear flame fireplace set into a floor-to-ceiling Venetian plaster surround' },
          { id: 'built-in-shelves', label: 'Integrated Built-in Bookcases', promptModifier: 'custom architectural floor-to-ceiling built-in shelving with integrated warm LED edge lighting' },
          { id: 'minimal-limewash', label: 'Textured Roman Clay / Limewash Wall', promptModifier: 'subtle hand-troweled Roman clay or limewash textured wall with minimalist gallery art' }
        ]
      },
      {
        id: 'coffee-table',
        label: 'Coffee Table & Accents',
        options: [
          { id: 'travertine-stone', label: 'Brutalist Travertine Stone Table', promptModifier: 'honed beige travertine stone monolithic coffee table' },
          { id: 'sculptural-wood', label: 'Sculptural Solid White Oak Table', promptModifier: 'sculptural organic curved solid white oak coffee table' },
          { id: 'smoked-glass-brass', label: 'Smoked Glass & Brushed Brass', promptModifier: 'minimalist smoked tempered glass coffee table with brushed antique brass frame' }
        ]
      }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Main kitchen, chef kitchen, open kitchen',
    iconName: 'Utensils',
    specificSections: [
      {
        id: 'cabinetry',
        label: 'Cabinetry Style',
        options: [
          { id: 'handleless-oak', label: 'Handleless Light White Oak', promptModifier: 'seamless handleless flat-panel European white oak cabinetry with integrated J-pull channels' },
          { id: 'slim-shaker', label: 'Modern Slim-Rail Shaker', promptModifier: 'contemporary slim-profile shaker cabinets in warm greige or matte off-white' },
          { id: 'matte-black-wood', label: 'Matte Charcoal & Fluted Wood', promptModifier: 'dramatic matte charcoal cabinets paired with fluted vertical timber island accent paneling' },
          { id: 'sage-green', label: 'Muted Sage Green Shaker', promptModifier: 'bespoke sage green cabinetry with soft satin finish' }
        ]
      },
      {
        id: 'countertops',
        label: 'Countertops & Island',
        options: [
          { id: 'waterfall-calacatta', label: 'Calacatta Waterfall Quartz Island', promptModifier: 'striking oversized kitchen island with full waterfall Calacatta quartz countertops and seamless mitered edges' },
          { id: 'honed-soapstone', label: 'Honed Charcoal Soapstone', promptModifier: 'rich honed matte soapstone countertops with subtle white veining' },
          { id: 'butcher-block-quartz', label: 'White Quartz with End-Grain Wood Accent', promptModifier: 'durable pure white quartz perimeter with integrated warm walnut end-grain prep butcher block' }
        ]
      },
      {
        id: 'backsplash',
        label: 'Backsplash & Tile',
        options: [
          { id: 'full-slab-marble', label: 'Full-Height Matching Stone Slab', promptModifier: 'continuous full-height marble slab backsplash extending seamlessly to upper cabinetry' },
          { id: 'handcrafted-zellige', label: 'Handcrafted Moroccan Zellige Tile', promptModifier: 'handcrafted glazed Moroccan zellige subway tiles with delicate glossy reflections' },
          { id: 'fluted-vertical', label: 'Vertical Fluted Ceramic Tile', promptModifier: 'textured vertical fluted matte ceramic tile backsplash' }
        ]
      },
      {
        id: 'hardware-fixtures',
        label: 'Fixtures & Hardware',
        options: [
          { id: 'brushed-brass', label: 'Brushed Champagne Brass Gooseneck', promptModifier: 'high-arc brushed champagne brass gooseneck faucet with matching cabinet pulls' },
          { id: 'matte-black', label: 'Matte Black Industrial Pull-Down', promptModifier: 'sleek matte black architectural pull-down faucet and minimalist hardware' }
        ]
      }
    ]
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    description: 'Primary bedroom, guest room, suite',
    iconName: 'Bed',
    specificSections: [
      {
        id: 'bed-frame',
        label: 'Bed Frame & Headboard',
        options: [
          { id: 'upholstered-linen', label: 'Tall Upholstered Linen Wingback', promptModifier: 'luxurious tall upholstered ivory linen wingback headboard with low platform bed' },
          { id: 'floating-oak-platform', label: 'Floating Oak Platform with Nightstands', promptModifier: 'Japanese-style low floating white oak platform bed with cantilevered nightstands' },
          { id: 'minimal-canopy', label: 'Minimalist Black Steel Canopy Bed', promptModifier: 'clean-lined slender matte black four-poster canopy bed frame' }
        ]
      },
      {
        id: 'bedding-textiles',
        label: 'Bedding & Textiles',
        options: [
          { id: 'layered-flax-linen', label: 'Layered French Flax Linen', promptModifier: 'generously layered organic washed French flax linen bedding with waffle knit throw blanket' },
          { id: 'hotel-plush-duvet', label: 'Crisp 5-Star Hotel White Bedding', promptModifier: 'crisp 800-thread count white Egyptian cotton duvet with plush down pillows and cashmere throw' }
        ]
      },
      {
        id: 'wall-accent',
        label: 'Accent Wall / Lighting',
        options: [
          { id: 'wood-slat-headboard', label: 'Acoustic Wood Slat Wall Behind Bed', promptModifier: 'warm acoustic vertical wood slat feature wall behind bed with recessed vertical LED strip lights' },
          { id: 'pendant-nightstands', label: 'Hanging Pendant Lamps Over Nightstands', promptModifier: 'delicate brass or ceramic pendant light fixtures suspended gracefully over both bedside nightstands' }
        ]
      }
    ]
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    description: 'Primary bath, powder room, ensuite',
    iconName: 'Bath',
    specificSections: [
      {
        id: 'vanity',
        label: 'Vanity & Mirror',
        options: [
          { id: 'floating-wood-vanity', label: 'Floating White Oak Double Vanity', promptModifier: 'floating natural white oak double vanity with under-cabinet ambient lighting and fluted drawers' },
          { id: 'marble-monolith-vanity', label: 'Monolithic Stone Vessel Vanity', promptModifier: 'custom stone vanity with integrated seamless basin sink and wall-mounted faucets' },
          { id: 'black-framed-modern', label: 'Matte Black Steel Frame Vanity', promptModifier: 'open matte black steel framework vanity with slatted lower shelf and white porcelain basin' }
        ]
      },
      {
        id: 'shower-tub',
        label: 'Shower & Tub',
        options: [
          { id: 'freestanding-soaking-tub', label: 'Freestanding Oval Soaking Tub', promptModifier: 'sculptural matte resin freestanding oval soaking tub with floor-mounted brass filler' },
          { id: 'frameless-walk-in', label: 'Frameless Glass Walk-in Wet Room', promptModifier: 'expansive frameless glass walk-in shower with ceiling-mounted rainfall head and built-in tiled niche' },
          { id: 'crittall-glass-door', label: 'Black Crittall French Grid Shower Screen', promptModifier: 'architectural black metal grid Crittall glass shower enclosure' }
        ]
      },
      {
        id: 'tile',
        label: 'Wall & Floor Tile',
        options: [
          { id: 'large-porcelain-slabs', label: 'Continuous Large Porcelain Slabs', promptModifier: 'seamless floor-to-ceiling large format porcelain stone slabs with minimal grout lines' },
          { id: 'vertical-kitkat-tiles', label: 'Kit-Kat / Finger Mosaic Tiles', promptModifier: 'refined vertical finger mosaic kit-kat tiles in matte off-white or soft eucalyptus' },
          { id: 'terrazzo-accent', label: 'Warm Terrazzo Feature Wall', promptModifier: 'warm Venetian terrazzo tile accent wall behind the vanity and mirror' }
        ]
      }
    ]
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    description: 'Formal dining, breakfast nook, dining area',
    iconName: 'Coffee',
    specificSections: [
      {
        id: 'dining-table',
        label: 'Dining Table',
        options: [
          { id: 'live-edge-oak', label: 'Live-Edge Solid White Oak Table', promptModifier: 'handcrafted solid European white oak dining table with subtle natural edge' },
          { id: 'oval-marble-tulip', label: 'Oval Calacatta Marble Table', promptModifier: 'sculptural oval Calacatta marble dining table with pedestal base' },
          { id: 'dark-walnut-extendable', label: 'Architectural Smoked Walnut Table', promptModifier: 'substantial smoked walnut dining table with clean chamfered edges' }
        ]
      },
      {
        id: 'dining-chairs',
        label: 'Dining Chairs',
        options: [
          { id: 'wishbone-cord', label: 'Hans Wegner Style Wishbone Chairs', promptModifier: 'classic Danish wishbone dining chairs in natural beech with woven paper cord seats' },
          { id: 'curved-boucle-chairs', label: 'Curved Bouclé Upholstered Chairs', promptModifier: 'modern curved dining armchairs upholstered in creamy textured bouclé fabric' },
          { id: 'leather-cantilever', label: 'Cantilevered Leather Chairs', promptModifier: 'Bauhaus style chrome and saddle leather cantilevered dining chairs' }
        ]
      },
      {
        id: 'overhead-lighting',
        label: 'Chandelier / Pendant',
        options: [
          { id: 'linear-brass-chandelier', label: 'Linear Minimalist Brass Chandelier', promptModifier: 'sleek horizontal linear brass chandelier suspended evenly over the center of the dining table' },
          { id: 'paper-sculptural-shade', label: 'Oversized Sculptural Noguchi Paper Pendant', promptModifier: 'large organic washi paper lantern pendant casting soft diffused ambient light' }
        ]
      }
    ]
  },
  {
    id: 'home-office',
    name: 'Home Office / Study',
    description: 'Workstation, executive desk, library',
    iconName: 'Briefcase',
    specificSections: [
      {
        id: 'desk',
        label: 'Executive Desk',
        options: [
          { id: 'solid-walnut-desk', label: 'Solid Walnut Executive Desk', promptModifier: 'substantial mid-century inspired solid walnut desk with tapered legs and brass cable port' },
          { id: 'minimalist-standing-desk', label: 'Motorized Oak Top Standing Desk', promptModifier: 'minimalist electric height-adjustable desk with solid oak top and hidden wire management' },
          { id: 'built-in-corner-workstation', label: 'Built-in Floating Wall Desk', promptModifier: 'custom floating white oak wall-to-wall desk with integrated storage drawers' }
        ]
      },
      {
        id: 'backdrop',
        label: 'Backdrop & Shelving',
        options: [
          { id: 'library-wood-paneling', label: 'Dark Moody Library Wood Paneling', promptModifier: 'sophisticated dark moody library paneling with integrated bookshelves and display niches' },
          { id: 'slat-acoustic-backdrop', label: 'Acoustic Slat Board Video Backdrop', promptModifier: 'professional acoustic felt and vertical wood slat wall ideal for camera calls' },
          { id: 'minimalist-gallery-shelves', label: 'Floating White Picture Ledges & Books', promptModifier: 'minimalist floating picture ledges displaying framed architecture sketches and curated art' }
        ]
      }
    ]
  },
  {
    id: 'sunroom-patio',
    name: 'Sunroom / Outdoor Patio',
    description: 'Patio, deck, terrace, four-season porch',
    iconName: 'Sun',
    specificSections: [
      {
        id: 'outdoor-seating',
        label: 'Seating & Lounge',
        options: [
          { id: 'teak-lounge-set', label: 'Grade-A Natural Teak Lounge Set', promptModifier: 'weather-resistant Grade-A natural teak sectional with thick sunbrella linen cushions' },
          { id: 'concrete-table-rattan', label: 'Polished Concrete Table & Woven Rattan Chairs', promptModifier: 'monolithic cast concrete outdoor table surrounded by all-weather wicker armchairs' }
        ]
      },
      {
        id: 'outdoor-features',
        label: 'Outdoor Features & Pergola',
        options: [
          { id: 'louvered-pergola', label: 'Modern Louvered Aluminum Pergola', promptModifier: 'modern matte black motorized louvered pergola with integrated ceiling fan and warm downlights' },
          { id: 'gas-fire-pit-table', label: 'Linear Concrete Gas Fire Pit', promptModifier: 'sleek rectangular cast concrete gas fire pit table with lava stones and cozy ambient flame' },
          { id: 'olive-trees-planters', label: 'Giant Tuscan Planters with Olive Trees', promptModifier: 'oversized aged terracotta and concrete planters housing pruned Mediterranean olive trees' }
        ]
      }
    ]
  }
];

export interface SampleRoom {
  id: string;
  name: string;
  roomType: string;
  thumbnail: string;
  description: string;
  defaultStyle: string;
  defaultPrompt: string;
}

// Curated high quality room photos for quick 1-click demonstration
export const SAMPLE_ROOMS: SampleRoom[] = [
  {
    id: 'sample-living-room',
    name: 'Dated Living Room',
    roomType: 'living-room',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    description: 'Empty room with plain walls, worn carpet, and window natural light',
    defaultStyle: 'japandi',
    defaultPrompt: 'Transform into a serene Japandi living room with a low curved bouclé sofa, travertine stone coffee table, vertical oak slat accent wall, and potted olive tree'
  },
  {
    id: 'sample-kitchen',
    name: 'Tired Kitchen Space',
    roomType: 'kitchen',
    thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
    description: 'Kitchen with standard wooden cabinets and dark countertop',
    defaultStyle: 'modern-minimalist',
    defaultPrompt: 'Upgrade to a high-end luxury modern kitchen with handleless fluted white oak cabinetry, waterfall Calacatta quartz island, and brushed champagne brass faucets'
  },
  {
    id: 'sample-bedroom',
    name: 'Plain Bedroom',
    roomType: 'bedroom',
    thumbnail: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1000&q=80',
    description: 'Blank bedroom with neutral carpet and standard ceiling lighting',
    defaultStyle: 'scandinavian',
    defaultPrompt: 'Transform into an airy Scandinavian bedroom with a floating oak platform bed, French flax linen bedding, hanging brass pendant lights, and light herringbone floors'
  },
  {
    id: 'sample-bathroom',
    name: 'Old Tile Bathroom',
    roomType: 'bathroom',
    thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
    description: 'Standard builder-grade bathroom space with dated fixtures',
    defaultStyle: 'luxury-transitional',
    defaultPrompt: 'Remodel into a 5-star spa bathroom with a freestanding oval soaking tub, frameless glass wet room shower with rainfall head, and floating fluted oak double vanity'
  }
];
