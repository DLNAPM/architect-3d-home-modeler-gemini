export interface LandscapingOption {
  id: string;
  label: string;
  description: string;
  promptSnippet: string;
}

export interface LandscapingCustomizationSection {
  id: string;
  title: string;
  description: string;
  options: LandscapingOption[];
}

export interface HouseViewSideConfig {
  id: 'front' | 'side' | 'back';
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  badge: string;
  sections: LandscapingCustomizationSection[];
  quickRefinements: string[];
}

export interface LandscapingStyle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  promptSnippet: string;
}

export interface LandscapingLighting {
  id: string;
  name: string;
  description: string;
  promptSnippet: string;
}

export interface LandscapingScope {
  id: string;
  label: string;
  description: string;
  promptSnippet: string;
}

export interface SampleLandscaping {
  id: string;
  name: string;
  viewSide: 'front' | 'side' | 'back';
  beforeImage: string;
  afterImage: string;
  style: string;
  summary: string;
  appliedOptions: string[];
}

// LUXURY OUTDOOR KITCHEN & GRILL SETS WITH PERGOLA
export const LUXURY_OUTDOOR_KITCHEN_OPTIONS: LandscapingOption[] = [
  {
    id: 'paradise-grills',
    label: 'Paradise Grills',
    description: 'Modular luxury kitchen island with commercial gas grill, cocktail station, granite/porcelain bar counter, and motorized louvered aluminum pergola.',
    promptSnippet: 'luxury Paradise Grills commercial-grade modular outdoor kitchen island featuring a heavy-duty stainless steel built-in gas grill, cocktail beverage center, sink, granite bar-height counter with luxury barstools, covered by an architectural motorized louvered aluminum pergola with integrated LED lighting'
  },
  {
    id: 'kokomo-outdoor-kitchens',
    label: 'Kokomo Outdoor Kitchens',
    description: 'Heavy-duty custom BBQ island with commercial Kokomo stainless grill, side burner, natural stone or stucco masonry base, and a handcrafted cedar shade pergola.',
    promptSnippet: 'custom Kokomo Outdoor Kitchens heavy-duty barbecue grill island with stacked stone masonry facade, bullnose granite countertops, built-in Kokomo stainless steel 5-burner gas grill, dual side burners, outdoor refrigerator, and an overhead warm cedar open-rafter shade pergola'
  },
  {
    id: 'bull-outdoor-products',
    label: 'Bull Outdoor Products',
    description: 'Premium Bull stainless steel grill island with ReliaBULL even-heat technology, rotisserie, warming drawers, and a modern cantilevered metal pergola.',
    promptSnippet: 'high-performance Bull Outdoor Products luxury barbecue island equipped with a premium built-in Bull stainless steel grill, infrared rotisserie, searing station, under-counter stainless storage drawers, polished quartz prep counter, and a sleek modern black steel cantilevered pergola canopy'
  },
  {
    id: 'range-outdoor-living',
    label: 'Range Outdoor Living',
    description: 'Sleek architectural outdoor kitchen suite with seamless Dekton ultra-compact surfaces, precision stainless grill, wine cooler, and a custom timber pergola.',
    promptSnippet: 'minimalist architectural Range Outdoor Living kitchen island featuring seamless Dekton heatproof countertops, precision built-in stainless grill, integrated dual-zone wine cooler, trash drawer, and an overhead modern warm fir timber pergola with recessed dimmable downlights'
  },
  {
    id: 'mont-alp',
    label: 'Mont Alp',
    description: 'Signature waterfall granite or black stainless modular suite with 6-burner infrared grill, beverage center, warming drawers, and an integrated pergola.',
    promptSnippet: 'deluxe Mont Alp / Mont Alpi modular outdoor kitchen suite with stunning white waterfall composite stone countertops, 6-burner stainless steel infrared rotisserie grill, built-in outdoor refrigerator and sink module, set beneath a stylish architectural dark metal pergola with ambient string lighting'
  },
  {
    id: 'no-outdoor-kitchen',
    label: 'Do NOT Add Outdoor Kitchen',
    description: 'No outdoor kitchen or grill set; keep the patio, deck, or lawn open for spacious seating and garden flora.',
    promptSnippet: 'explicitly do NOT include any outdoor kitchen, BBQ island, or cooking appliances; preserve the open patio, terrace, and garden space for relaxing seating and natural landscaping'
  }
];

// OUTDOOR POOL DESIGNS
export const OUTDOOR_POOL_DESIGN_OPTIONS: LandscapingOption[] = [
  {
    id: 'infinity-pools-negative-edge',
    label: 'Infinity Pools (Negative Edge)',
    description: 'Breathtaking vanishing negative edge pool with water spilling seamlessly into a lower catch basin, creating a horizon reflection effect.',
    promptSnippet: 'custom luxury negative-edge infinity pool where the water surface seamlessly cascades over a vanishing edge into a hidden lower catch basin, reflecting the open sky and surrounding landscape, bordered by sleek travertine coping'
  },
  {
    id: 'modern-geometric-pools',
    label: 'Modern Geometric Pools',
    description: 'Crisp rectilinear pool with clean architectural lines, integrated flush spa, and a wide Baja tanning ledge with in-pool loungers.',
    promptSnippet: 'contemporary geometric rectangular swimming pool with crisp linear edges, submerged Baja shelf sun ledge with floating luxury lounge chairs, and an integrated flush zero-edge hot tub spa with sheer water spillover'
  },
  {
    id: 'lagoon-style-natural-pools',
    label: 'Lagoon-Style / Natural Pools',
    description: 'Organic freeform pool with natural moss boulder rock waterfalls, grotto cave, flagstone beach entry, and lush tropical foliage.',
    promptSnippet: 'freeform naturalistic lagoon swimming pool surrounded by stacked natural moss rock boulders, cascading multi-tier stone waterfalls, swimming grotto, and lush biophilic tropical landscaping fringing the water'
  },
  {
    id: 'zero-entry-beach-entry-pools',
    label: 'Zero-Entry (Beach-Entry) Pools',
    description: 'Gradually sloping pebble or aggregate shore transitioning seamlessly from pool deck into water without steps.',
    promptSnippet: 'resort-style zero-entry beach-entry swimming pool with a gradual gently sloping non-slip pebble shore entry transitioning smoothly from the sun deck into turquoise water, accented with shallow splash bubbler fountains'
  },
  {
    id: 'lap-pools',
    label: 'Lap Pools',
    description: 'Long, narrow architectural pool engineered for exercise and swimming laps with sleek lane tile and minimalist surround.',
    promptSnippet: 'sleek architectural exercise lap pool with an elongated linear channel, contrasting dark waterline racing lane tiles, integrated submerged end-wall steps, and a minimalist low-profile limestone deck surround'
  },
  {
    id: 'no-pool',
    label: 'Do NOT add Pool',
    description: 'No swimming pool; focus ground area on lush open lawn, flowering botanical gardens, or extended paver terrace.',
    promptSnippet: 'explicitly do NOT include any swimming pool or spa basin; dedicate the grounds to lush green open grass lawn, flowering perennial borders, and comfortable ground-level patio hardscaping'
  }
];

// PUTTING GREEN DESIGNS
export const PUTTING_GREEN_DESIGN_OPTIONS: LandscapingOption[] = [
  {
    id: 'resort-style-poolside-green',
    label: 'The Resort-Style Poolside Integration',
    description: 'Championship-grade synthetic putting and chipping green seamlessly bordering the pool deck and travertine terrace with regulation cups and flagsticks.',
    promptSnippet: 'resort-style custom synthetic turf putting green seamlessly integrated alongside the swimming pool deck, featuring tour-grade multi-directional synthetic turf, contrasting longer fringe grass collar, stainless cup holes with custom flagsticks, and seamless travertine transition borders'
  },
  {
    id: 'multi-level-tiered-green',
    label: 'The Multi-Level Tiered Green',
    description: 'Dynamic multi-tiered green with distinct elevation breaks, undulating contours, natural stone retaining steps, and multiple target pin placements.',
    promptSnippet: 'architectural multi-level tiered synthetic putting green with custom elevation slopes, subtle contours and breaks, dry-stacked stone retaining step transitions between tiers, and four precision regulation cups with numbered golf flags'
  },
  {
    id: 'modern-minimalist-geometric-green',
    label: 'The Modern Minimalist Geometric Green',
    description: 'Crisp rectilinear putting green framed by raw steel or concrete borders with low-profile LED perimeter lighting and architectural gravel.',
    promptSnippet: 'contemporary minimalist geometric putting green with sharp rectangular laser-straight borders, raw steel or honed concrete edge restraints, contrasting dark river rock perimeter beds, integrated low-profile flush LED night lighting, and regulation target cups'
  },
  {
    id: 'short-game-training-complex',
    label: 'The Short Game Training Complex (with Sunken Bunkers)',
    description: 'Professional backyard short game facility with sunken white silica sand bunkers, graduated rough fringe, and dedicated chipping stations.',
    promptSnippet: 'professional backyard golf practice complex featuring an undulating synthetic putting green, authentic sunken white silica sand bunkers with natural revetted turf faces, graduated second-cut rough fringe, and multiple designated short-game chipping tee pads'
  },
  {
    id: 'organic-country-club-ribbon',
    label: 'The Organic Country Club Ribbon',
    description: 'Undulating organic freeform ribbon green winding naturally through lush perennial garden beds, ornamental grasses, and mature trees.',
    promptSnippet: 'organic country club ribbon putting green with graceful meandering natural curves winding through lush flowering perennial gardens and ornamental fountain grasses, featuring true-roll bentgrass-style turf, subtle break contours, and custom brass golf flags'
  },
  {
    id: 'no-putting-green',
    label: 'Do NOT add Putting Green',
    description: 'No synthetic golf green; preserve natural turf lawn, ornamental groundcover, or garden planters.',
    promptSnippet: 'explicitly do NOT include any putting green or golf turf; keep the lawn as natural grass, ornamental groundcover, or decorative flowering garden landscape'
  }
];

// 1. HOUSE VIEW SIDES & SECTION CONFIGURATIONS
export const HOUSE_VIEW_SIDES: HouseViewSideConfig[] = [
  {
    id: 'front',
    name: 'Front of the House',
    tagline: 'Curb Appeal, Driveway, Entryway & Facade',
    description: 'Transform your front yard, entrance, driveway, porch portico, and street-facing architectural presence.',
    iconName: 'Home',
    badge: 'Curb Appeal',
    quickRefinements: [
      'Add slate flagstone walkway with warm low-voltage LED lights',
      'Replace front lawn with drought-tolerant xeriscape and olive tree',
      'Add modern horizontal cedar portico over front entrance',
      'Add low dry-stack stone retaining planter wall with hydrangeas',
      'Install modern black sconces and dramatic tree up-lighting',
      'Add symmetrical boxwood hedges and colorful flowering borders',
      'Upgrade driveway to herringbone cobblestone pavers',
      'Add modern frosted glass pivot entry door with cedar sidelights'
    ],
    sections: [
      {
        id: 'drivewayWalkway',
        title: 'Driveway & Front Walkway',
        description: 'Paving materials and approach pathways to the front entry.',
        options: [
          {
            id: 'slate-flagstone',
            label: 'Natural Slate Flagstone Walkway',
            description: 'Organic irregular blue-gray slate stepping stones with creeping thyme mortar.',
            promptSnippet: 'natural slate flagstone walkway with organic stepping stones framed by low green creeping groundcover'
          },
          {
            id: 'paver-cobblestone',
            label: 'Herringbone Paver Stone Driveway',
            description: 'Tumbled warm charcoal and mocha concrete pavers in 45-degree herringbone.',
            promptSnippet: 'luxurious charcoal and sand-toned interlocking paver stone driveway laid in an intricate herringbone pattern with clean granite curbing'
          },
          {
            id: 'stamped-concrete',
            label: 'Modern Large-Format Concrete Pavers',
            description: 'Oversized 36x24 light gray architectural concrete pavers spaced with dark river pebbles.',
            promptSnippet: 'contemporary oversized architectural concrete pavers with crisp joints separated by smooth black Mexican river rock'
          },
          {
            id: 'decomposed-granite',
            label: 'Decomposed Granite with Steel Edging',
            description: 'Warm gold crushed granite permeable pathway bordered by raw corten steel.',
            promptSnippet: 'natural warm gold decomposed granite pathway bordered with clean rustic corten steel edging'
          }
        ]
      },
      {
        id: 'frontFlora',
        title: 'Lawn & Botanical Landscaping',
        description: 'Flora, flowerbeds, trees, and groundcover for maximum curb appeal.',
        options: [
          {
            id: 'xeriscape-drought',
            label: 'Drought-Tolerant Modern Xeriscape',
            description: 'Feather reed grass, blue agave, lavender, olive trees, and river stone swales.',
            promptSnippet: 'drought-tolerant modern xeriscaping featuring architectural blue agave succulents, waving purple fountain grasses, olive tree focal points, and smooth river rock drainage swales'
          },
          {
            id: 'cottage-flowering',
            label: 'English Cottage Garden & Hydrangeas',
            description: 'Lush blooming Annabelle hydrangeas, lavender, salvia, and layered boxwood hedges.',
            promptSnippet: 'romantic English cottage garden overflowing with blooming white and blue hydrangeas, fragrant lavender, purple salvia, and manicured green boxwood hedges'
          },
          {
            id: 'zen-japanese',
            label: 'Japanese Zen Front Garden',
            description: 'Sculptural Japanese black pine, weeping laceleaf red maple, and moss rock mounds.',
            promptSnippet: 'serene Japanese zen front garden with an artistic cloud-pruned black pine, vibrant crimson Japanese maple, moss-covered boulders, and raked gravel'
          },
          {
            id: 'lush-green-lawn',
            label: 'Manicured Emerald Bluegrass Lawn',
            description: 'Deep green, golf-course manicured turf with clean razor-sharp mulch borders.',
            promptSnippet: 'pristine deep green golf-course quality Kentucky bluegrass lawn with laser-crisp dark brown cedar mulch borders and specimen ornamental flowering trees'
          }
        ]
      },
      {
        id: 'frontArchitecture',
        title: 'Porch & Facade Enhancements',
        description: 'Portico beams, stone accents, modern front door, and architectural cladding.',
        options: [
          {
            id: 'cedar-portico',
            label: 'Modern Cedar Timber Portico',
            description: 'Warm natural cedar timber post-and-beam front entry roof with recessed downlights.',
            promptSnippet: 'custom modern natural cedar timber portico over the front door with heavy-timber architectural brackets and warm soffit lighting'
          },
          {
            id: 'stacked-stone',
            label: 'Natural Stacked Stone Veneer Accents',
            description: 'Dry-stack gray and tan ledgestone veneer applied to foundation and porch columns.',
            promptSnippet: 'natural ledgestone stacked-stone masonry veneer accenting the porch pillars and house foundation base'
          },
          {
            id: 'horizontal-slat',
            label: 'Cedar Slat Privacy Screen & Pivot Door',
            description: 'Warm horizontal wood slat accents with oversized modern matte black entry door.',
            promptSnippet: 'contemporary horizontal stained cedar privacy screen wall beside an oversized black modern front door with frosted vertical glass panels'
          },
          {
            id: 'craftsman-columns',
            label: 'Tapered Craftsman Stone & Wood Columns',
            description: 'Classic tapered square white columns atop flared stone pedestal bases.',
            promptSnippet: 'classic American Craftsman porch columns with white tapered columns resting on robust fieldstone pedestals'
          }
        ]
      },
      {
        id: 'frontLighting',
        title: 'Exterior Lighting & Ambiance',
        description: 'Illumination systems for safety, warmth, and dramatic nighttime appeal.',
        options: [
          {
            id: 'uplighting-warm',
            label: 'Tree Up-Lighting & Soft Facade Wash',
            description: '2700K warm brass spot lights washing trees and architectural columns.',
            promptSnippet: 'architectural low-voltage landscape lighting with warm 2700K brass spotlights up-lighting mature trees and softly washing the house exterior'
          },
          {
            id: 'pathway-modern',
            label: 'Minimalist Linear Pathway Bollards',
            description: 'Sleek black aluminum downward-facing pathway lights illuminating walkways.',
            promptSnippet: 'sleek matte black linear pathway bollard lights casting soft pools of warm illumination along the entryway walk'
          },
          {
            id: 'soffit-lanterns',
            label: 'Recessed Soffit Lights & Carriage Lanterns',
            description: 'Overhead roofline downlights paired with oversized wrought iron lanterns.',
            promptSnippet: 'integrated roof soffit downlights framing the roofline paired with statement carriage lanterns beside the garage and entryway'
          }
        ]
      }
    ]
  },
  {
    id: 'back',
    name: 'Back of the House',
    tagline: 'Outdoor Living, Patio, Pool, Deck & Entertaining',
    description: 'Design luxury backyards: swimming pools, outdoor kitchens, dining patios, fire pits, decks, and private garden retreats.',
    iconName: 'Trees',
    badge: 'Outdoor Living',
    quickRefinements: [
      'Add Paradise Grills luxury kitchen with motorized pergola',
      'Add custom Kokomo outdoor BBQ island with cedar pergola',
      'Add Bull Outdoor Products ReliaBULL grill with rotisserie',
      'Add Range Outdoor Living modern Dekton kitchen and pergola',
      'Add Mont Alp waterfall granite kitchen with rotisserie grill',
      'Add modern infinity negative-edge swimming pool',
      'Add modern geometric pool with sunken spa and Baja shelf',
      'Add natural lagoon-style pool with boulder rock waterfalls',
      'Add zero-entry beach-entry pool with pebble shore',
      'Add architectural lap pool with dark waterline racing lanes',
      'Install resort-style poolside putting green with tournament turf',
      'Add multi-level tiered putting green with stone steps',
      'Add championship short game training green with sunken bunkers',
      'Add organic country club ribbon putting green through gardens',
      'Add sunken gas fire pit with curved built-in stone banquette',
      'Surround perimeter with 12ft privacy arborvitae trees'
    ],
    sections: [
      {
        id: 'patioDecking',
        title: 'Patio, Decking & Hardscaping',
        description: 'Main ground surfaces for relaxing, outdoor dining, and gathering.',
        options: [
          {
            id: 'bluestone-patio',
            label: 'Natural Bluestone Expansive Patio',
            description: 'Patterned Pennsylvania bluestone with clean joints and seamless coping.',
            promptSnippet: 'luxurious expansive Pennsylvania bluestone patio with crisp thermal-finished flagstone pavers and seamless pool coping'
          },
          {
            id: 'composite-deck',
            label: 'Multi-Level Teak Composite Deck',
            description: 'Trex-style weather-resistant composite decking with flush stair riser LED lights.',
            promptSnippet: 'multi-tiered warm teak-toned composite deck with black metal baluster railings and integrated flush step LED riser illumination'
          },
          {
            id: 'pergola-louvered',
            label: 'Motorized Louvered Roof Pergola & Terrace',
            description: 'Matte black aluminum pergola with motorized rotating louvers and ceiling fan.',
            promptSnippet: 'modern matte black architectural pergola with motorized louvered roof, integrated ceiling fan, and dimmable LED perimeter strip lighting over a concrete terrace'
          },
          {
            id: 'travertine-poolside',
            label: 'French-Pattern Ivory Travertine Patio',
            description: 'Heat-resistant tumbled ivory travertine pavers staying cool underfoot.',
            promptSnippet: 'elegant French-pattern ivory travertine paver terrace with bullnose coping bordering the swimming pool'
          }
        ]
      },
      {
        id: 'outdoorCooking',
        title: 'Luxury Outdoor Kitchen and Grill Sets with Pergola',
        description: 'Built-in commercial-grade BBQ grill suites, kitchen islands, beverage centers, and shaded architectural pergolas.',
        options: LUXURY_OUTDOOR_KITCHEN_OPTIONS
      },
      {
        id: 'poolWater',
        title: 'Outdoor Pool Designs',
        description: 'Resort-style custom swimming pools, spas, sun shelves, and architectural water features.',
        options: OUTDOOR_POOL_DESIGN_OPTIONS
      },
      {
        id: 'puttingGreen',
        title: 'Putting Green Designs',
        description: 'Custom championship synthetic putting and chipping greens with sand bunkers, elevation breaks, and tournament turf.',
        options: PUTTING_GREEN_DESIGN_OPTIONS
      },
      {
        id: 'fireGathering',
        title: 'Fire Pit & Gathering Lounges',
        description: 'Fire tables, sunken seating, and conversational seating arrangements.',
        options: [
          {
            id: 'sunken-fire-pit',
            label: 'Sunken Gas Fire Pit with Curved Banquette',
            description: 'Recessed conversation pit with built-in stone bench and lava rock gas burner.',
            promptSnippet: 'sunken modern stone conversation fire pit with built-in upholstered curved masonry seating and a linear gas fire trough with black lava rock'
          },
          {
            id: 'teak-fire-table',
            label: 'Teak Sectional Lounge with Fire Table',
            description: 'Deep-seating weather-resistant outdoor sofa around a concrete gas fire table.',
            promptSnippet: 'luxurious deep-seating outdoor teak sectional with light gray Sunbrella cushions arranged around a minimalist rectangular concrete fire table'
          },
          {
            id: 'boulder-fire-ring',
            label: 'Rustic Boulder Fire Ring with Adirondacks',
            description: 'Natural stone wood-burning pit surrounded by classic wooden Adirondack chairs.',
            promptSnippet: 'naturalistic crushed gravel fire circle with a rustic fieldstone wood-burning fire ring surrounded by cedar Adirondack chairs'
          }
        ]
      },
      {
        id: 'backyardPrivacy',
        title: 'Perimeter Privacy & Flora',
        description: 'Living privacy screens, specimen trees, and lush backyard borders.',
        options: [
          {
            id: 'arborvitae-hedge',
            label: '12ft Emerald Green Arborvitae Privacy Wall',
            description: 'Dense evergreen hedge providing year-round complete neighbor screening.',
            promptSnippet: 'dense 12-foot tall mature emerald green arborvitae evergreen privacy hedge enclosing the perimeter for total backyard seclusion'
          },
          {
            id: 'resort-palms',
            label: 'Tropical Resort Palms & Flowering Hibiscus',
            description: 'Windmill palms, banana trees, birds of paradise, and vibrant tropical color.',
            promptSnippet: 'tropical resort oasis landscaping with architectural palm trees, broad-leafed birds of paradise, vibrant red hibiscus, and lush ferns'
          },
          {
            id: 'raised-gardens',
            label: 'Raised Cedar Vegetable & Herb Beds',
            description: 'Clean geometric raised planter boxes with gravel paths and drip irrigation.',
            promptSnippet: 'neat geometric raised cedar garden planter boxes brimming with fresh vegetables and herbs, arranged on clean pea gravel paths'
          }
        ]
      }
    ]
  },
  {
    id: 'side',
    name: 'Side of the House',
    tagline: 'Walkways, Breezeways, Utility Enclosures & Privacy',
    description: 'Turn narrow, forgotten side yards into inviting architectural walkways, functional utility hideaways, or tranquil secret gardens.',
    iconName: 'Footprints',
    badge: 'Walkway & Utility',
    quickRefinements: [
      'Add large concrete pavers surrounded by dark Mexican beach pebbles',
      'Install 7ft horizontal stained cedar privacy fence',
      'Add living green wall ivy trellis and soft downward step lights',
      'Add custom cedar enclosure to hide trash bins and AC unit',
      'Hang overhead warm bistro string lights between eaves and fence',
      'Create compact bamboo zen alcove with stone water basin',
      'Install artificial pet turf run along walkway',
      'Add wall-mounted cedar vertical herb planter'
    ],
    sections: [
      {
        id: 'sideWalkway',
        title: 'Side Walkway & Stepping Stones',
        description: 'Pathway design connecting front and back yards.',
        options: [
          {
            id: 'concrete-pavers-pebbles',
            label: 'Concrete Pavers with Mexican Beach Pebbles',
            description: 'Large floating concrete rectangles framed in dark polished river stones.',
            promptSnippet: 'clean modern large-format rectangular concrete stepping pavers set within a bed of smooth dark Mexican black river pebbles'
          },
          {
            id: 'flagstone-groundcover',
            label: 'Flagstone Trail with Creeping Thyme',
            description: 'Rustic flat flagstones with green moss or fragrant creeping thyme in joints.',
            promptSnippet: 'meandering natural flagstone pathway with lush aromatic creeping thyme and green moss growing between the stone joints'
          },
          {
            id: 'timber-deck-walkway',
            label: 'Elevated Cedar Boardwalk Walkway',
            description: 'Low-profile wooden boardwalk floating above gravel with perimeter lights.',
            promptSnippet: 'low-profile horizontal natural cedar plank boardwalk pathway elevated slightly above a dark river rock bed with subtle low-voltage LED side lights'
          },
          {
            id: 'pea-gravel-borders',
            label: 'Pea Gravel Path with Bluestone Steppers',
            description: 'Compacted honey pea gravel with steel borders and square bluestone treads.',
            promptSnippet: 'compacted natural honey pea gravel walkway with raw steel edge restraints and spaced square bluestone stepping pavers'
          }
        ]
      },
      {
        id: 'sidePrivacy',
        title: 'Fencing & Privacy Enclosures',
        description: 'Boundary walls, property line fences, and vertical green screens.',
        options: [
          {
            id: 'horizontal-cedar-fence',
            label: '7ft Modern Horizontal Cedar Slat Fence',
            description: 'Clean horizontal tongue-and-groove cedar planks with matte black steel posts.',
            promptSnippet: '7-foot contemporary horizontal warm cedar wood slat privacy fence supported by sleek powder-coated black steel posts'
          },
          {
            id: 'living-ivy-trellis',
            label: 'Living Green Wall Trellis & Vines',
            description: 'Black wire trellis system covered in lush Boston ivy, star jasmine, and climbing roses.',
            promptSnippet: 'vertical living wall wire grid trellis climbing with dense star jasmine and evergreen ivy covering the property wall in vibrant greenery'
          },
          {
            id: 'decorative-metal-panels',
            label: 'Laser-Cut Decorative Metal Privacy Screen',
            description: 'Architectural corten or black metal panels with botanical cut-out patterns.',
            promptSnippet: 'laser-cut architectural metal privacy screen panels with a stylish geometric botanical motif and warm backlighting'
          }
        ]
      },
      {
        id: 'sideUtility',
        title: 'Side Yard Function & Utilities',
        description: 'Storage, pet amenities, and concealing ugly utility equipment.',
        options: [
          {
            id: 'cedar-trash-enclosure',
            label: 'Cedar HVAC & Trash Bin Enclosure',
            description: 'Custom slatted wood screen neatly hiding air conditioning units and trash cans.',
            promptSnippet: 'built-in custom horizontal cedar screen enclosure with top latch lid neatly concealing air conditioning compressors and garbage recycle bins'
          },
          {
            id: 'pet-turf-run',
            label: 'Pet Agility Turf with French Drain',
            description: 'Odor-free, high-drainage synthetic turf area with safe dog run gate.',
            promptSnippet: 'clean high-drainage synthetic pet turf run with clean edging, automated rinse sprinklers, and stainless modern dog gate'
          },
          {
            id: 'zen-bamboo-nook',
            label: 'Compact Bamboo Zen Meditation Nook',
            description: 'Clumping bamboo hedge, stone tsukubai water basin, and granite garden lantern.',
            promptSnippet: 'tranquil side yard bamboo meditation alcove with non-invasive clumping bamboo, Japanese stone water basin, and granite pagoda lantern'
          },
          {
            id: 'potting-shed-nook',
            label: 'Modular Potting Bench & Tool Storage',
            description: 'Compact timber potting counter with tool hooks and hanging cedar flower boxes.',
            promptSnippet: 'charming compact cedar potting bench with galvanized metal work surface, wall-mounted tool storage rack, and hanging flower baskets'
          }
        ]
      },
      {
        id: 'puttingGreen',
        title: 'Putting Green Designs',
        description: 'Long green putting strip, dynamic tiered golf green, or minimal geometric practice turf.',
        options: PUTTING_GREEN_DESIGN_OPTIONS
      },
      {
        id: 'sideLighting',
        title: 'Side Yard Lighting & Atmosphere',
        description: 'Overhead bistro lights, wall washes, and pathway glow.',
        options: [
          {
            id: 'bistro-string-lights',
            label: 'Overhead Warm Bistro String Lights',
            description: 'Vintage Edison bulb festoon lights suspended between roof eaves and fence.',
            promptSnippet: 'warm glowing commercial-grade Edison bulb bistro string lights strung in a zigzag pattern overhead between house eaves and the fence line'
          },
          {
            id: 'wall-graze-fixtures',
            label: 'Architectural Wall-Grazing Sconces',
            description: 'Up/down modern LED sconces highlighting house siding and fence texture.',
            promptSnippet: 'modern architectural up-and-down LED cylinder wall sconces washing textured brick siding with clean warm light'
          },
          {
            id: 'low-step-lights',
            label: 'Ground-Level Recessed Step & Well Lights',
            description: 'Flush well lights in gravel casting a gentle upward wash on greenery.',
            promptSnippet: 'flush-mount waterproof ground well lights embedded in the river rock casting a subtle warm upward wash on foliage'
          }
        ]
      }
    ]
  }
];

// 2. DESIGN STYLES (Applies across all house views)
export const LANDSCAPING_STYLES: LandscapingStyle[] = [
  {
    id: 'modern-minimalist',
    name: 'Modern Architectural Minimalist',
    tagline: 'Clean lines, architectural grasses, concrete, black accents',
    description: 'Crisp geometric forms, architectural fountain grasses, poured concrete pavers, dark gravel, and understated elegance.',
    promptSnippet: 'modern architectural minimalist landscape style, clean geometric lines, smooth architectural concrete, black metal accents, sculptural ornamental grasses, and clean mulch'
  },
  {
    id: 'california-mediterranean',
    name: 'California Mediterranean Drought-Wise',
    tagline: 'Olive trees, lavender, decomposed granite, limestone',
    description: 'Water-conscious Mediterranean luxury with specimen olive trees, fragrant French lavender, warm limestone, and terracotta accents.',
    promptSnippet: 'luxurious California Mediterranean drought-tolerant landscape style, mature gnarled olive trees, purple French lavender bushes, warm limestone flagstone, and decomposed granite'
  },
  {
    id: 'english-cottage',
    name: 'English Cottage & Lush Traditional',
    tagline: 'Abundant perennials, curved pathways, boxwood, hydrangeas',
    description: 'Romantic layers of blooming flowers, meandering stone paths, classic boxwood borders, climbing roses, and lush garden depth.',
    promptSnippet: 'abundant English cottage garden style with blooming Annabelle hydrangeas, climbing David Austin roses, curved bluestone paths, manicured boxwood topiary hedges, and layered perennial flowers'
  },
  {
    id: 'japanese-zen',
    name: 'Japanese Zen Sanctuary',
    tagline: 'Japanese maples, black pines, moss, water basins, tranquility',
    description: 'Contemplative harmony featuring cloud-pruned pines, weeping laceleaf maples, natural weathered moss rock, and serene stone lanterns.',
    promptSnippet: 'authentic Japanese zen landscape style, artistic weeping Japanese laceleaf red maple, cloud-pruned Japanese black pines, mossy river boulders, granite pagoda lanterns, and raked gravel'
  },
  {
    id: 'tropical-resort',
    name: 'Tropical Resort Oasis',
    tagline: 'Fan palms, birds of paradise, travertine, tiki torches, lush pool',
    description: 'Five-star Hawaiian / Balinese resort feeling with broad-leaf fan palms, flowering hibiscus, exotic foliage, and travertine stone.',
    promptSnippet: 'tropical luxury resort oasis landscape style, swaying mature fan palms, giant bird of paradise plants, deep green monstera, travertine pool terrace, and resort-grade landscape lighting'
  },
  {
    id: 'mountain-craftsman',
    name: 'Mountain Rustic & Craftsman',
    tagline: 'Native boulders, cedar timber pergolas, slate, wildflowers',
    description: 'Heavy timber craftsmanship, massive native granite boulders, blue-gray slate patios, and native woodland plantings.',
    promptSnippet: 'mountain modern rustic craftsman landscape style, heavy cedar timber framing, large native granite boulders, slate flagstone patio, alpine evergreens, and wild mountain ferns'
  }
];

// 3. LIGHTING & TIME OF DAY
export const LANDSCAPING_LIGHTINGS: LandscapingLighting[] = [
  {
    id: 'golden-hour',
    name: 'Golden Hour Sunset',
    description: 'Warm, directional late-afternoon sunlight with long soft shadows and glowing foliage.',
    promptSnippet: 'captured during golden hour sunset with rich warm amber directional sunlight, long soft natural shadows, and warm golden foliage highlights'
  },
  {
    id: 'sunny-midday',
    name: 'Crisp Sunny Midday',
    description: 'Bright natural daylight with clear blue sky and true color saturation.',
    promptSnippet: 'crisp clear sunny midday daylight, bright blue sky with wispy white clouds, vibrant natural saturated greens and rich natural shadows'
  },
  {
    id: 'twilight-evening',
    name: 'Twilight & Dramatic Night Illumination',
    description: 'Deep indigo dusk sky with glowing landscape up-lighting, pathway lanterns, and fire warmth.',
    promptSnippet: 'captured at twilight blue hour with deep indigo evening sky, dramatic warm 2700K landscape spotlights up-lighting trees, glowing pathway lanterns, and warm ambient outdoor lighting'
  },
  {
    id: 'misty-morning',
    name: 'Fresh Morning Mist',
    description: 'Soft diffused morning illumination with fresh dew on greenery and gentle sun rays.',
    promptSnippet: 'serene early morning light with subtle morning mist, dew drops glistening on foliage, and soft diffused sunbeams breaking through mature trees'
  }
];

// 4. TRANSFORMATION SCOPES
export const LANDSCAPING_SCOPES: LandscapingScope[] = [
  {
    id: 'complete-overhaul',
    label: 'Complete Landscape Overhaul',
    description: 'Reimagine all hardscaping, walkways, lawn, trees, lighting, and plant beds from scratch.',
    promptSnippet: 'complete comprehensive landscaping overhaul replacing all overgrown vegetation, outdated ground surfaces, and old structures with a brand new cohesive high-end landscape design'
  },
  {
    id: 'hardscape-patio',
    label: 'Hardscape & Outdoor Living Focus',
    description: 'Focus on decks, patios, pergolas, pools, fire pits, and stone walkways while preserving house structure.',
    promptSnippet: 'hardscaping and outdoor living transformation focusing on new luxury stone patios, composite decking, fire features, and architectural pergolas'
  },
  {
    id: 'botanical-greening',
    label: 'Botanical & Garden Redesign',
    description: 'Keep existing hardscape footprint and revitalize flowerbeds, lawns, trees, and plantings.',
    promptSnippet: 'botanical garden enhancement revitalizing all plant beds, flower borders, ornamental specimen trees, and lawn turf within the existing layout'
  }
];

// 5. SAMPLE LANDSCAPING SHOWCASE (For paywall previews and instant testing)
export const SAMPLE_LANDSCAPING_HOMES: SampleLandscaping[] = [
  {
    id: 'sample-front-modern',
    name: 'Suburban Front Yard Curb Appeal',
    viewSide: 'front',
    style: 'modern-minimalist',
    summary: 'Replaced patchy grass with clean concrete pavers, drought-tolerant grasses, and warm tree up-lighting.',
    appliedOptions: ['Modern Concrete Pavers', 'Architectural Xeriscape', 'Cedar Timber Portico', 'Warm Up-Lighting'],
    beforeImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sample-back-resort',
    name: 'Backyard Pool & Outdoor Lounge',
    viewSide: 'back',
    style: 'modern-minimalist',
    summary: 'Turned a sloped lawn into a luxury gunite pool, sunken fire pit, and expansive bluestone entertainment terrace.',
    appliedOptions: ['Heated Gunite Pool', 'Sunken Gas Fire Pit', 'Bluestone Patio', 'Cedar Pergola'],
    beforeImage: 'https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sample-side-zen',
    name: 'Side Yard Boardwalk & Secret Garden',
    viewSide: 'side',
    style: 'japanese-zen',
    summary: 'Converted a muddy overgrown side pathway into an elevated cedar boardwalk with bamboo privacy screen and bistro lights.',
    appliedOptions: ['Elevated Cedar Boardwalk', 'Horizontal Cedar Slat Fence', 'Overhead Bistro Lights', 'Trash Enclosure'],
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sample-front-cottage',
    name: 'Craftsman Front Garden & Flagstone Walk',
    viewSide: 'front',
    style: 'english-cottage',
    summary: 'Added winding flagstone pathway, romantic hydrangeas, boxwood borders, and stacked stone foundation veneer.',
    appliedOptions: ['Slate Flagstone Walkway', 'English Cottage Garden', 'Stacked Stone Veneer', 'Lantern Sconces'],
    beforeImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sample-back-kitchen',
    name: 'Backyard Outdoor Kitchen & Dining',
    viewSide: 'back',
    style: 'california-mediterranean',
    summary: 'Added full BBQ island, teak al fresco dining pergola, olive trees, and gas fire table.',
    appliedOptions: ['Chef BBQ Island', 'Louvered Pergola', 'Sunken Fire Pit', 'Travertine Patio'],
    beforeImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sample-side-modern',
    name: 'Side Yard Concrete Steppers & River Rock',
    viewSide: 'side',
    style: 'modern-minimalist',
    summary: 'Modern large concrete pavers floating in black Mexican river rock with vertical living wall and sleek utility screen.',
    appliedOptions: ['Concrete Pavers with Pebbles', 'Living Green Wall Trellis', 'Recessed Ground Lights', 'Pet Turf Run'],
    beforeImage: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
  }
];
