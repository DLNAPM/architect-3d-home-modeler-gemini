export interface RoomTypeConfig {
  id: string;
  name: string;
  description: string;
  category?: 'main' | 'basement';
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

export interface FeatureWallCategory {
  id: string;
  label: string;
  description: string;
  options: { id: string; label: string; promptModifier: string }[];
}

export const FEATURE_WALL_CATEGORIES: FeatureWallCategory[] = [
  {
    id: 'none',
    label: 'No Feature Wall',
    description: 'Standard cohesive wall finish matching the selected room color palette',
    options: [
      { id: 'standard-matching', label: 'Seamless Standard Walls', promptModifier: 'walls uniformly finished in the selected clean architectural paint color with no special accent wall' }
    ]
  },
  {
    id: 'water-feature',
    label: 'Water Feature',
    description: 'Indoor water wall fountains, glass rain cascades & slate trickles',
    options: [
      { id: 'recessed-slate-waterfall', label: 'Recessed Natural Slate Indoor Waterfall', promptModifier: 'architectural recessed dark natural slate indoor water wall with a gentle continuous sheet of water cascading down into a river pebble basin with soft waterproof uplighting' },
      { id: 'glass-rain-curtain', label: 'Illuminated Glass Rain-Curtain Water Wall', promptModifier: 'sleek floor-to-ceiling tempered glass indoor rain water curtain with warm LED edge illumination and an integrated concealed recirculating reservoir' },
      { id: 'fluted-marble-fountain', label: 'Fluted Travertine Water Wall with Copper Spouts', promptModifier: 'luxury honed travertine stone wall with gently trickling minimalist architectural copper water spouts splashing softly into a low-profile basin' },
      { id: 'mirror-water-panel', label: 'Bronze Mirror Architectural Water Panel', promptModifier: 'contemporary bronze-tinted mirror water cascade wall with subtle ambient backlighting creating shimmering reflections' }
    ]
  },
  {
    id: 'painted-and-finished',
    label: 'Painted and Finished',
    description: 'Roman clay, limewash, board & batten, Venetian plaster & millwork',
    options: [
      { id: 'roman-clay-limewash', label: 'Hand-Troweled Roman Clay / Limewash Finish', promptModifier: 'feature wall with organic hand-troweled textured Roman clay and matte limewash finish in subtle earthy taupe tones' },
      { id: 'board-and-batten-millwork', label: 'Custom Floor-to-Ceiling Board & Batten Paneling', promptModifier: 'architectural floor-to-ceiling custom board and batten wall paneling painted in a sophisticated deep satin finish' },
      { id: 'venetian-polished-plaster', label: 'Polished High-Gloss Venetian Plaster', promptModifier: 'luxury polished Venetian plaster accent wall with subtle marble-like depth and burnished light-reflecting sheen' },
      { id: 'geometric-wood-molding', label: 'Contemporary Geometric Box Picture Molding', promptModifier: 'elegant transitional box-molding wainscoting and geometric architectural wall trim with refined proportions' }
    ]
  },
  {
    id: 'stone-brick-tile',
    label: 'Stone, Brick, and Tile',
    description: 'Stacked ledge stone, exposed brick, zellige & porcelain slabs',
    options: [
      { id: 'stacked-ledgestone', label: 'Dry-Stacked Natural Ledge Stone Feature Wall', promptModifier: 'commanding dry-stacked natural grey and warm sandstone ledge rock feature wall with deep tactile texture and perimeter graze downlighting' },
      { id: 'exposed-reclaimed-brick', label: 'Authentic Distressed Reclaimed Brick Wall', promptModifier: 'warm textured exposed reclaimed red brick feature wall with vintage mortar wash and industrial architectural charm' },
      { id: 'bookmatched-porcelain-slab', label: 'Bookmatched Calacatta Gold Porcelain Slab', promptModifier: 'grand continuous bookmatched Calacatta marble porcelain slab feature wall with sweeping dramatic gold and charcoal veining' },
      { id: 'fluted-zellige-tile', label: 'Vertical Fluted Glazed Zellige Ceramic Tile Wall', promptModifier: 'floor-to-ceiling vertical fluted glazed artisan zellige tile accent wall with soft pearlescent luster' }
    ]
  },
  {
    id: 'wallpaper-and-murals',
    label: 'Wallpaper and Murals',
    description: 'Textured grasscloth, scenic landscape murals & botanical botanics',
    options: [
      { id: 'natural-woven-grasscloth', label: 'Textured Hand-Woven Sisal Grasscloth Wallpaper', promptModifier: 'luxury natural hand-woven Japanese sisal grasscloth wallpaper with organic textural grain and warm earthy richness' },
      { id: 'scenic-botanical-mural', label: 'Subtle Chinoiserie / Misty Forest Scenic Landscape Mural', promptModifier: 'large-scale panoramic misty forest landscape wall mural in monochrome charcoal and soft sage tones' },
      { id: 'modern-geometric-wallpaper', label: 'Art Deco Metallic & Matte Geometric Wallpaper', promptModifier: 'sophisticated modern geometric designer wallpaper with subtle brushed metallic gold accents on dark matte background' },
      { id: 'abstract-watercolor-mural', label: 'Large-Scale Abstract Mineral Watercolor Accent Mural', promptModifier: 'custom full-wall abstract fluid watercolor mural with soft washes of warm taupe, sand, and charcoal' }
    ]
  },
  {
    id: 'functional-and-display',
    label: 'Functional and Display',
    description: 'Built-in library shelves, wood slat media consoles & backlit niches',
    options: [
      { id: 'backlit-display-niches', label: 'Custom Arch Display Niches with Warm LED Backlighting', promptModifier: 'custom architectural plaster display wall featuring recessed illuminated curved arched niches displaying curated sculptures and ceramics' },
      { id: 'acoustic-wood-slat-system', label: 'Vertical White Oak Acoustic Wood Slat Feature Wall', promptModifier: 'floor-to-ceiling vertical fluted natural white oak acoustic wood slat wall with integrated concealed warm vertical LED channel lighting' },
      { id: 'built-in-library-bookcase', label: 'Floor-to-Ceiling Built-In Library & Cabinetry', promptModifier: 'bespoke floor-to-ceiling built-in architectural bookcase unit with ladder rail, integrated warm shelf lighting, and closed lower cabinet storage' },
      { id: 'floating-media-console-panel', label: 'Floating Marble Media Console with Slatted Backdrop', promptModifier: 'integrated entertainment feature wall with a floating honed marble console, textured backdrop, and hidden wire conduits' }
    ]
  }
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
  },
  {
    id: 'game-room',
    name: 'Game Room',
    description: 'Pool table & stand-up games',
    category: 'basement',
    iconName: 'Gamepad2',
    specificSections: [
      {
        id: 'gaming-centerpiece',
        label: 'Pool Table & Stand-up Games Focus',
        options: [
          { id: 'pool-table-and-arcades', label: 'Slate Pool Table + Dual Stand-Up Arcades', promptModifier: 'championship-grade slate billiard pool table with matte black cloth centered under a brass drop fixture, flanked by two full-size retro stand-up arcade game cabinets with glowing marquees and a pinball machine against the wall' },
          { id: 'luxury-pool-table', label: 'Luxury Custom Slate Pool Table Only', promptModifier: 'bespoke modern custom slate pool table with dark charcoal felt, precision wooden cue rack on wall, and overhead low-profile linear LED billiard lighting' },
          { id: 'standup-arcade-row', label: 'Row of Stand-Up Arcade & Pinball Machines', promptModifier: 'dedicated arcade zone with a lineup of 4 stand-up classic retro arcade cabinets, glowing backlit marquees, and a vintage collector pinball machine' },
          { id: 'pool-table-shuffleboard', label: 'Pool Table + Long Wood Shuffleboard', promptModifier: 'championship tournament pool table alongside a 14-foot handcrafted maple wood shuffleboard table with brass abacus scorekeepers' }
        ]
      },
      {
        id: 'spectator-seating',
        label: 'Spectator Seating & Social Area',
        options: [
          { id: 'leather-spectator-chairs', label: 'Bar-Height Leather Spectator Chairs with Drink Rail', promptModifier: 'elevated bar-height cognac leather spectator armchairs with footrests and an integrated solid wood drink ledge along the perimeter wall' },
          { id: 'plush-modular-sofa', label: 'Low Modular Gaming Lounge Sectional', promptModifier: 'plush low-profile modular velvet seating area with beverage side tables and textured accent pillows' },
          { id: 'pub-booth-nook', label: 'Built-in Pub Booth Nook for Spectators', promptModifier: 'custom built-in upholstered banquet booth seating with a round cafe table for board games and spectator drinks' }
        ]
      },
      {
        id: 'billiard-ambiance',
        label: 'Billiards Lighting & Wall Ambiance',
        options: [
          { id: 'linear-pool-light', label: 'Low-Hung Matte Black Linear Pool Table Light & Slat Wall', promptModifier: 'sleek horizontal linear pool table pendant in matte black suspended directly over the table, with vertical oak slat acoustic accent walls' },
          { id: 'neon-brick-accent', label: 'Exposed Brick with Custom Neon Game Sign', promptModifier: 'urban exposed reclaimed brick accent wall with a custom warm-white neon game lounge sign and warm perimeter wall sconces' },
          { id: 'dark-acoustic-led', label: 'Dark Charcoal Acoustic Walls with Dimmable LED Glow', promptModifier: 'matte charcoal sound-absorbing walls with hidden warm-white baseboard and crown cove LED lighting' }
        ]
      }
    ]
  },
  {
    id: 'soundproof-studio',
    name: 'Studio / Soundproof Room',
    description: 'Soundproof booth & acoustic studio',
    category: 'basement',
    iconName: 'Mic',
    specificSections: [
      {
        id: 'soundproofing',
        label: 'Soundproofing & Acoustic Treatment',
        options: [
          { id: 'sound-isolated-vocal-booth', label: 'Sound-Isolated Glass Vocal Booth with Heavy Acoustic Door', promptModifier: 'custom double-glazed acoustic glass soundproof isolation vocal booth with heavy-duty acoustic drop-seal door, studio condenser microphone on boom arm, and interior sound dampening panels' },
          { id: 'diffusor-panels-slats', label: 'Floor-to-Ceiling Oak Acoustic Diffusor Slats & Fabric Bass Traps', promptModifier: 'architectural floor-to-ceiling staggered oak acoustic diffusor slats combined with high-density fabric-wrapped beveled sound absorption wall panels and corner bass traps' },
          { id: 'hexagonal-geometric-grid', label: 'Hexagonal Charcoal Sound-Absorbing Geometric Wall System', promptModifier: 'seamless geometric hexagonal acoustic wall panels in charcoal and natural wood tones providing studio-grade soundproofing' }
        ]
      },
      {
        id: 'studio-equipment',
        label: 'Studio Desk & Equipment Setup',
        options: [
          { id: 'multi-tier-producer-desk', label: 'Multi-Tier Walnut Producer Desk with Studio Monitors', promptModifier: 'ergonomic solid walnut multi-tier studio production desk with rack-mounted analog gear, dual computer displays, and Yamaha studio monitor speakers on isolation pads' },
          { id: 'podcast-broadcast-desk', label: 'Multi-Guest Podcast Desk with Shure SM7B Broadcast Boom Arms', promptModifier: 'custom curved oak podcasting conference table with Shure SM7B microphones on articulated broadcast arms, headphone monitoring stations, and acoustic desktop isolation' },
          { id: 'synthesizer-guitar-station', label: 'Synthesizer Keyboard & Wall-Mounted Guitars Tracking Station', promptModifier: 'dedicated instrument tracking corner with wall-mounted electric and acoustic guitars, 88-key weighted synthesizer keyboard stand, and studio guitar amplifier' }
        ]
      },
      {
        id: 'studio-lighting-ceiling',
        label: 'Studio Mood Lighting & Ceiling Clouds',
        options: [
          { id: 'ceiling-acoustic-cloud', label: 'Suspended Acoustic Ceiling Cloud with Warm Recessed Spots', promptModifier: 'suspended fabric-wrapped acoustic ceiling cloud with integrated recessed warm spotlights hung directly over the console desk' },
          { id: 'ambient-amber-indigo-cove', label: 'Dimmable Dual-Tone Amber & Indigo Ambient Backlighting', promptModifier: 'subtle dimmable dual-tone ambient LED backlighting behind acoustic panels and monitors, casting a warm focused creative glow' },
          { id: 'directional-track-spots', label: 'Directional Matte Black Studio Track Spotlights & Edison Lamps', promptModifier: 'matte black ceiling track lighting with directional pinpoint spotlights and vintage amber Edison bulb pendants' }
        ]
      }
    ]
  },
  {
    id: 'basement-bar',
    name: 'Bar with Stools & Table',
    description: 'Wet bar, stools & high-top pub table',
    category: 'basement',
    iconName: 'Wine',
    specificSections: [
      {
        id: 'bar-counter',
        label: 'Bar Counter & Cabinetry',
        options: [
          { id: 'waterfall-quartzite', label: 'Waterfall Dark Quartzite Bar with Under-Counter LED Glow', promptModifier: 'imposing 10-foot wet bar counter with a thick waterfall-edge leathered dark quartzite stone top, integrated under-counter warm LED ribbon lighting, and undermount stainless prep sink' },
          { id: 'fluted-walnut-brass', label: 'Rich Fluted American Walnut Bar Front with Brass Foot Rail', promptModifier: 'bespoke rich fluted American walnut curved bar front with a heavy brushed brass foot rail and polished black granite countertop' },
          { id: 'poured-concrete-steel', label: 'Poured Concrete Industrial Counter with Steel Rivets & Sink', promptModifier: 'seamless poured cast concrete bar top with blackened steel structural rivets and reclaimed barnwood front paneling' }
        ]
      },
      {
        id: 'stools-and-table',
        label: 'Bar Stools & Pub Table Setup',
        options: [
          { id: 'cognac-stools-pub-table', label: 'Cognac Swivel Leather Stools + Matching Round High-Top Pub Table', promptModifier: 'four swivel cognac saddle-leather bar stools with backrests along the bar, paired with an adjacent matching round walnut high-top pub table with two high bar chairs' },
          { id: 'boucle-stools-marble-bistro', label: 'Modern Bouclé Bar Stools + Calacatta Marble Bistro Table', promptModifier: 'sculptural brass and cream bouclé upholstered bar stools lined up at the counter, accompanied by a round Calacatta marble pub table and matching stools' },
          { id: 'industrial-iron-stools-timber-table', label: 'Industrial Distressed Leather Stools + Solid Timber Pub Table', promptModifier: 'vintage industrial iron-framed swivel bar stools with distressed leather seats, paired with a solid timber square pub-height table' }
        ]
      },
      {
        id: 'back-bar-display',
        label: 'Back-Bar Display & Beverage Station',
        options: [
          { id: 'mirrored-floating-shelves', label: 'Antiqued Mirrored Back-Bar with Floating Illuminated Glass Shelves', promptModifier: 'dramatic antiqued mirror back-bar feature wall with floating brass-bracketed glass shelves holding premium spirits with warm concealed under-shelf lighting' },
          { id: 'dual-wine-coolers-stemware', label: 'Dual Glass-Door Wine/Beverage Coolers & Custom Stemware Racks', promptModifier: 'dual built-in under-counter glass-door beverage and wine cooler units with overhead custom hanging stemware racks for wine and cocktail glasses' },
          { id: 'stone-arch-bottle-racks', label: 'Masonry Stone Arch Niche with Criss-Cross Wine Bottle Racks', promptModifier: 'recessed masonry stone arch back-bar niche with custom criss-cross walnut wine bottle racks and soft accent uplighting' }
        ]
      }
    ]
  },
  {
    id: 'movie-room',
    name: 'Movie Room',
    description: 'Studio sound, screen & lounge chairs',
    category: 'basement',
    iconName: 'Film',
    specificSections: [
      {
        id: 'theater-lounge-chairs',
        label: 'Lounge Chairs & Cinema Seating',
        options: [
          { id: 'tiered-motorized-recliners', label: 'Tiered Motorized Leather Cinema Lounge Recliners with Cup Holders', promptModifier: 'two-tiered riser platform featuring rows of ultra-plush motorized top-grain black leather cinema lounge recliners with integrated cup holders, USB charging, and LED footwell lighting' },
          { id: 'curved-cinema-pit', label: 'Deep Plush Curved Velvet & Bouclé Cinema Pit Daybed', promptModifier: 'luxurious deep multi-person curved velvet and bouclé cinema pit lounger with oversized scatter cushions and low modular ottomans' },
          { id: 'dual-chaise-loungers', label: 'Oversized Dual Couple Chaise Loungers with Swivel Snack Trays', promptModifier: 'oversized dual couple chaise loungers upholstered in rich charcoal microfiber with swivel wooden snack tray tables' }
        ]
      },
      {
        id: 'screen-and-studio-sound',
        label: 'Display Screen & Studio Surround Sound Setup',
        options: [
          { id: 'projector-150-studio-sound', label: '150-Inch 4K Laser Projector Screen + Hidden Studio Atmos Speakers', promptModifier: 'massive 150-inch ambient-light-rejecting fixed frame projector screen paired with a ceiling-mounted 4K laser projector and hidden in-wall Dolby Atmos studio surround sound speakers behind acoustically transparent fabric' },
          { id: 'flush-oled-reference-towers', label: 'Flush-Mount 98-Inch 4K OLED with Studio Reference Tower Speakers', promptModifier: 'ultra-large 98-inch 4K OLED display mounted flush on a dark acoustic felt wall, framed by reference studio tower speakers and a powerful low-profile subwoofer' },
          { id: 'motorized-drop-screen-soundbar', label: 'Motorized Ceiling Drop Screen with Architectural Studio Sound Array', promptModifier: 'motorized drop-down tensioned projection screen retracting invisibly into the ceiling, complemented by an architectural high-fidelity studio sound array' }
        ]
      },
      {
        id: 'cinema-ambiance',
        label: 'Theater Ambiance & Starlight Ceiling',
        options: [
          { id: 'starlight-fiber-optic', label: 'Fiber-Optic Twinkling Starlight Constellation Ceiling', promptModifier: 'custom acoustic fiber-optic twinkling constellation starry night sky ceiling with dark perimeter cove LED strip lighting' },
          { id: 'velvet-acoustic-sconces', label: 'Navy Acoustic Sound-Absorbing Velvet Walls with Dimmable Cinema Sconces', promptModifier: 'rich navy or charcoal sound-absorbing padded acoustic wall panels with vertical brass column cinema sconces set to 10% warm evening dim' },
          { id: 'concession-bar-posters', label: 'Backlit Glass Movie Poster Marquee Frames & Concession Counter', promptModifier: 'dimly lit movie room entrance featuring illuminated glass movie poster marquee frames and a compact counter with a vintage popcorn machine' }
        ]
      }
    ]
  },
  {
    id: 'exercise-room',
    name: 'Exercise Room',
    description: 'TV, ceiling fan(s) & workout gear',
    category: 'basement',
    iconName: 'Dumbbell',
    specificSections: [
      {
        id: 'tv-and-fans',
        label: 'Wall-Mounted TV & Ceiling Fan(s)',
        options: [
          { id: 'smart-tv-dual-ceiling-fans', label: 'Large Wall-Mounted Smart TV + Dual Industrial Matte Black Ceiling Fans', promptModifier: 'large 65-inch high-definition smart fitness workout display TV mounted at eye level on the main wall, complemented by dual industrial matte-black multi-blade ceiling fans mounted symmetrically overhead for powerful airflow' },
          { id: 'dual-screens-brushed-fans', label: 'Twin 55-Inch Workout Display Screens + Modern Brushed Nickel Ceiling Fans', promptModifier: 'twin wall-mounted 55-inch workout instruction screens paired with two modern aerodynamic brushed nickel ceiling fans with warm integrated LED center lights' },
          { id: 'giant-screen-shop-fan', label: 'Commanding 75-Inch Streaming Fitness TV + High-Velocity Aerodynamic Fan', promptModifier: 'commanding 75-inch wall-mounted Peloton/fitness streaming screen paired with an oversized high-velocity industrial ceiling fan with aviation-style contoured blades' }
        ]
      },
      {
        id: 'gym-flooring',
        label: 'Gym Flooring & Drop Zones',
        options: [
          { id: 'rubber-tiles-8mm', label: 'Heavy-Duty 8mm Speckled Black Rubber Gym Tile Flooring', promptModifier: 'durable commercial-grade 8mm black rubber gym flooring with subtle grey and white flecks throughout the entire room' },
          { id: 'turf-rubber-hybrid', label: 'Interlocking Black Shock Rubber with Green Sled Turf Track', promptModifier: 'resilient black shock-absorbent rubber flooring featuring a 4-foot wide vibrant green sprint turf track down the center' },
          { id: 'light-oak-rubber-zones', label: 'Luxury Light Oak Gym Vinyl with Heavy Equipment Rubber Mats', promptModifier: 'waterproof light oak luxury gym vinyl plank flooring with dedicated heavy-duty rubber lifting platform zones' }
        ]
      },
      {
        id: 'fitness-equipment',
        label: 'Fitness & Workout Equipment',
        options: [
          { id: 'power-rack-barbells-dumbbells', label: 'Full Wall Mirrors with Commercial Power Rack, Barbell & Dumbbells', promptModifier: 'floor-to-ceiling mirror wall reflecting a matte-black commercial half-rack with Olympic barbell, bumper plates, and a 3-tier hex dumbbell rack with adjustable bench' },
          { id: 'cardio-cable-trainer', label: 'Smart Stationary Bike, Commercial Treadmill & Dual Cable Trainer', promptModifier: 'premium fitness setup featuring a NordicTrack commercial treadmill, connected stationary cycling bike, and a dual-pulley functional trainer cable machine' },
          { id: 'yoga-wellness-mobility', label: 'Mindful Yoga, Pilates & Mobility Zone with Swedish Ladder & Mats', promptModifier: 'serene wellness exercise zone with wall-mounted Swedish ladder, premium cork yoga mats, kettlebells, foam rollers, and resistance band hooks' }
        ]
      }
    ]
  },
  {
    id: 'wine-room',
    name: 'Wine Room',
    description: 'Wine wall, bucket chairs, coffee table & coasters',
    category: 'basement',
    iconName: 'Wine',
    specificSections: [
      {
        id: 'wine-wall-type',
        label: 'Wine Wall Type',
        options: [
          { id: 'frameless-glass-climate-wall', label: 'Frameless Glass Climate-Controlled Wine Wall with Backlit Acrylic Rods', promptModifier: 'floor-to-ceiling frameless tempered glass climate-controlled wine display wall with horizontal floating black aluminum and backlit acrylic bottle cradles displaying rare vintage bottles with warm 2700K perimeter LED edge glow' },
          { id: 'custom-black-steel-pegs', label: 'Matte Black Triple-Deep Metal Peg System on Dark Walnut Backing', promptModifier: 'striking architectural modern wine display wall utilizing precision matte black triple-deep metal bottle pegs mounted against rich quarter-sawn dark walnut acoustic paneling with discrete recessed accent downlights' },
          { id: 'stone-masonry-arch-cellar-wall', label: 'Dry-Stacked Stone Arch Wall with Diagonal Oak Lattice Racking', promptModifier: 'custom stone masonry cellar feature wall with a vaulted barrel arch, integrated rustic white oak diamond cross bottle bins, and illuminated presentation shelves' },
          { id: 'minimalist-cable-suspended-wall', label: 'Floor-to-Ceiling Cable Suspended Tension Wine Racking System', promptModifier: 'ultra-modern minimalist floor-to-ceiling stainless steel tension wire suspension racking holding wine bottles floating in mid-air against a textured dark charcoal Roman clay backdrop' }
        ]
      },
      {
        id: 'bucket-chairs',
        label: 'Bucket Chairs',
        options: [
          { id: 'curved-boucle-swivel-bucket', label: 'Deep Curved Cream Bouclé Swivel Bucket Lounge Chairs', promptModifier: 'pair of sculptural deep-seated curved cream bouclé swivel bucket barrel chairs with ergonomic wrap-around backrests and brushed bronze plinth bases' },
          { id: 'cognac-saddle-leather-bucket', label: 'Tailored Cognac Saddle-Leather Low Bucket Armchairs', promptModifier: 'two luxury cognac aniline saddle-leather low-profile bucket lounge chairs with bespoke baseball stitching and blackened steel splayed swivel frames' },
          { id: 'emerald-velvet-tub-chairs', label: 'Plush Emerald Green Velvet Tub Bucket Chairs', promptModifier: 'plush deep jewel-tone emerald green velvet curved bucket armchairs with channel-tufted interior backs and satin brass accents' },
          { id: 'charcoal-cashmere-barrel-bucket', label: 'Charcoal Wool & Cashmere Wrap-Around Barrel Bucket Chairs', promptModifier: 'modern tailored charcoal grey wool-cashmere upholstered curved barrel bucket chairs designed for relaxed wine tasting sessions' }
        ]
      },
      {
        id: 'coffee-table',
        label: 'Coffee Table',
        options: [
          { id: 'fluted-travertine-plinth', label: 'Honed Fluted Travertine Monolithic Low Plinth Coffee Table', promptModifier: 'low-profile monolithic honed beige travertine coffee table with fluted cylindrical base and rich natural porous veining' },
          { id: 'smoked-glass-brass-table', label: 'Smoked Tempered Glass Round Table with Brushed Brass Drum Base', promptModifier: 'sculptural round coffee table with thick smoked tempered glass top and a brushed antique brass slatted drum pedestal' },
          { id: 'solid-smoked-oak-block', label: 'Chamfered Solid Smoked Walnut / Oak Block Coffee Table', promptModifier: 'organic minimalist solid smoked dark walnut block coffee table with smooth chamfered edges and matte satin oil finish' },
          { id: 'nero-marquina-marble', label: 'Nero Marquina Black Marble Low Coffee Table with White Veins', promptModifier: 'striking low-slung Nero Marquina black marble circular coffee table with stark dramatic white calcite veins' }
        ]
      },
      {
        id: 'wine-glass-coasters',
        label: 'Wine Glass Coasters & Tasting Accents',
        options: [
          { id: 'brass-rimmed-white-marble-coasters', label: 'Heavy White Carrara Marble Coasters with Brushed Brass Rims', promptModifier: 'curated tasting setup on coffee table with a set of four heavy white Carrara marble wine glass coasters with brushed brass rims, paired with crystal Riedel Bordeaux wine glasses and a crystal decanter' },
          { id: 'raw-travertine-stone-coasters', label: 'Hand-Cut Chiseled Raw Travertine Stone Coasters', promptModifier: 'bespoke hand-chiseled raw porous travertine stone coasters resting on the table alongside fine stemmed crystal Burgundy glasses and sommelier corkscrew accessories' },
          { id: 'stitched-saddle-leather-coasters', label: 'Hand-Stitched Tan Saddle Leather Coasters in Matching Holder', promptModifier: 'artisan hand-stitched thick saddle-tan leather round coasters with debossed monogram in a matching leather brass-accented holder, supporting delicate sparkling wine flutes' },
          { id: 'matte-black-slate-copper-coasters', label: 'Matte Black Slate & Brushed Copper Hexagonal Coasters', promptModifier: 'modern geometric matte black natural slate coasters with brushed warm copper inlay borders, paired with stemless crystal wine tumblers and an aerator' }
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
    id: 'sample-game-room',
    name: 'Basement → Game Room',
    roomType: 'game-room',
    thumbnail: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement space converted to a game room with pool table & stand-up games',
    defaultStyle: 'industrial-loft',
    defaultPrompt: 'Transform this basement space into a luxury Game Room with a championship slate pool table, dual stand-up arcade cabinets with glowing marquees, elevated bar-height leather spectator chairs with a drink rail, and vertical acoustic wood slat walls'
  },
  {
    id: 'sample-soundproof-studio',
    name: 'Basement → Soundproof Studio',
    roomType: 'soundproof-studio',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement studio with soundproof isolation booth and acoustic treatment',
    defaultStyle: 'modern-minimalist',
    defaultPrompt: 'Transform this basement into a soundproof recording studio featuring a glass-isolated vocal booth, multi-tier walnut producer desk with studio monitors, floor-to-ceiling acoustic diffusor slats, and a suspended ceiling acoustic cloud with warm spots'
  },
  {
    id: 'sample-basement-bar',
    name: 'Basement → Bar & Stools',
    roomType: 'basement-bar',
    thumbnail: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement wet bar with leather stools, pub table, and liquor display',
    defaultStyle: 'mid-century',
    defaultPrompt: 'Transform this basement area into a high-end bar featuring a waterfall dark quartzite bar counter with under-counter LED glow, swivel cognac leather bar stools, a matching round high-top pub table, and an illuminated antiqued mirror back-bar with glass bottle display'
  },
  {
    id: 'sample-movie-room',
    name: 'Basement → Movie Room',
    roomType: 'movie-room',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement home theater with studio sound and plush lounge chairs',
    defaultStyle: 'luxury-transitional',
    defaultPrompt: 'Transform this basement space into a luxury movie room with tiered motorized black leather cinema lounge recliners, a 150-inch 4K laser projector screen, hidden in-wall Dolby Atmos studio surround sound speakers, and a fiber-optic twinkling starlight ceiling'
  },
  {
    id: 'sample-exercise-room',
    name: 'Basement → Exercise Room',
    roomType: 'exercise-room',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement fitness gym with wall-mounted TV, dual ceiling fans & weights',
    defaultStyle: 'modern-minimalist',
    defaultPrompt: 'Transform this basement room into an exercise gym featuring a large wall-mounted smart TV at eye level, dual industrial matte black ceiling fans overhead for maximum airflow, heavy-duty speckled rubber gym flooring, and a full-wall mirror with commercial power rack and dumbbells'
  },
  {
    id: 'sample-wine-room',
    name: 'Basement → Wine Room',
    roomType: 'wine-room',
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80',
    description: 'Basement tasting room with frameless glass wine wall, bucket chairs & coffee table',
    defaultStyle: 'luxury-transitional',
    defaultPrompt: 'Transform this basement space into a luxury Wine Room featuring a frameless glass climate-controlled wine wall with backlit acrylic bottle rods, two deep curved cream bouclé swivel bucket lounge chairs, a low fluted travertine plinth coffee table with white Carrara marble wine glass coasters, crystal stemware, and ambient warm cove lighting'
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
