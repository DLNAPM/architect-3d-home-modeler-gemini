import { Room } from '@/types';

export const ROOM_CATEGORIES: Room[] = [
  {
    name: 'Front Exterior',
    options: {
      sidingMaterial: { label: 'Siding Material', options: ['Vinyl Siding', 'Brick', 'Stone Veneer', 'Stucco', 'Wood Siding'] },
      roofStyle: { label: 'Roof Style', options: ['Gable Roof', 'Hip Roof', 'Mansard Roof', 'Flat Roof', 'Shed Roof'] },
      windowTrimColor: { label: 'Window Trim Color', options: ['White', 'Black', 'Gray', 'Bronze', 'Beige'] },
      landscaping: { label: 'Landscaping', options: ['Minimalist Garden', 'Lush English Garden', 'Modern Xeriscape', 'Japanese Zen Garden', 'Tropical Paradise'] },
      vehicle: { label: 'Vehicle in Driveway', options: ['None', 'Modern Electric SUV', 'Classic Convertible', 'Luxury Sedan', 'Family Minivan'] },
    }
  },
  {
    name: 'Back Exterior',
    options: {
      sidingMaterial: { label: 'Siding Material', options: ['Vinyl Siding', 'Brick', 'Stone Veneer', 'Stucco', 'Wood Siding'] },
      roofStyle: { label: 'Roof Style', options: ['Gable Roof', 'Hip Roof', 'Mansard Roof', 'Flat Roof', 'Shed Roof'] },
      landscaping: { label: 'Landscaping', options: ['Manicured Lawn', 'Wildflower Meadow', 'Spacious Patio with Fire Pit', 'Multi-level Deck', 'Vegetable Garden'] },
      swimmingPool: { label: 'Swimming Pool', options: ['No Pool', 'Rectangular Infinity Pool', 'Lagoon-style Pool', 'Modern Lap Pool', 'Plunge Pool'] },
      amenities: { label: 'Outdoor Amenities', options: ['None', 'Paradise Grill Kitchen', 'Basketball Half-Court', 'Elegant Water Fountain', 'Small Putting Green'] },
    }
  },
  {
    name: 'Living Room',
    options: {
      flooring: { label: 'Flooring', options: ['Hardwood', 'Plush Carpet', 'Polished Concrete', 'Large Format Tile', 'Luxury Vinyl Plank'] },
      wallColor: { label: 'Wall Color', options: ['Warm White', 'Cool Gray', 'Deep Navy Blue', 'Earthy Green', 'Beige'] },
      lighting: { label: 'Lighting', options: ['Recessed Lighting', 'Modern Chandelier', 'Track Lighting', 'Floor Lamps', 'Sconces'] },
      furnitureStyle: { label: 'Furniture Style', options: ['Mid-Century Modern', 'Contemporary', 'Traditional', 'Industrial', 'Scandinavian'] },
      fireplace: { label: 'Fireplace', options: ['No Fireplace', 'Modern Linear Gas Fireplace', 'Traditional Brick Fireplace', 'Minimalist Electric Fireplace', 'Stone Hearth Fireplace'] },
    }
  },
  {
    name: 'Kitchen',
    options: {
      flooring: { label: 'Flooring', options: ['Hardwood', 'Porcelain Tile', 'Natural Stone', 'Luxury Vinyl Tile', 'Stained Concrete'] },
      cabinetStyle: { label: 'Cabinet Style', options: ['Shaker', 'Flat-Panel', 'Traditional Raised-Panel', 'Glass-Front', 'Open Shelving'] },
      countertop: { label: 'Countertop Material', options: ['Quartz', 'Granite', 'Marble', 'Butcher Block', 'Stainless Steel'] },
      appliances: { label: 'Appliances', options: ['Stainless Steel Suite', 'Panel-Ready Integrated', 'Matte Black', 'White', 'Retro Colored'] },
      backsplash: { label: 'Backsplash', options: ['Subway Tile', 'Mosaic Tile', 'Full-Height Stone Slab', 'Glass Sheet', 'Exposed Brick'] },
    }
  },
  {
    name: 'Primary Bedroom',
    options: {
      flooring: { label: 'Flooring', options: ['Plush Carpet', 'Hardwood', 'Engineered Wood', 'Cork', 'Wool Area Rug over Hardwood'] },
      wallColor: { label: 'Wall Color', options: ['Soothing Blue', 'Calm Green', 'Warm Taupe', 'Charcoal Gray', 'Cream'] },
      lighting: { label: 'Lighting', options: ['Pendant Lights', 'Chandelier', 'Bedside Table Lamps', 'Recessed Lighting', 'Ceiling Fan with Light'] },
      bedStyle: { label: 'Bed Style', options: ['Upholstered Headboard', 'Four-Poster Bed', 'Platform Bed', 'Canopy Bed', 'Sleigh Bed'] },
      closetDesign: { label: 'Closet Design', options: ['Walk-in Closet with Custom Shelving', 'Reach-in Closet with Sliding Doors', 'Wardrobe Armoire', 'Open Concept Closet', 'Built-in Closet System'] },
    }
  },
  {
    name: 'Primary Bathroom',
    options: {
      flooring: { label: 'Flooring', options: ['Marble Tile', 'Porcelain Tile', 'Heated Floors', 'Pebble Tile', 'Travertine'] },
      vanityStyle: { label: 'Vanity Style', options: ['Floating Vanity', 'Double Sink Vanity', 'Traditional Cabinet Vanity', 'Vessel Sink Vanity', 'Pedestal Sink'] },
      showerTub: { label: 'Shower or Tub', options: ['Freestanding Tub', 'Walk-in Shower with Rainfall Head', 'Clawfoot Tub', 'Wet Room', 'Alcove Tub/Shower Combo'] },
      tileStyle: { label: 'Tile Style', options: ['Large Format', 'Subway', 'Hexagonal', 'Herringbone', 'Penny Tile'] },
      mirrorStyle: { label: 'Mirror Style', options: ['Backlit LED Mirror', 'Framed His-and-Hers Mirrors', 'Large Frameless Mirror', 'Ornate Antique Mirror', 'Pivoting Mirrors'] },
    }
  },
  {
    name: 'Home Office',
    options: {
      flooring: { label: 'Flooring', options: ['Hardwood', 'Low-pile Carpet', 'Laminate', 'Epoxy Coated Concrete', 'Area Rug'] },
      wallColor: { label: 'Wall Color', options: ['Neutral Gray', 'Focus-enhancing Blue', 'Energizing White', 'Accent Wall', 'Bookshelf Wallpaper'] },
      deskStyle: { label: 'Desk Style', options: ['Executive Desk', 'Standing Desk', 'L-Shaped Desk', 'Minimalist Writing Desk', 'Floating Desk'] },
      officeChair: { label: 'Office Chair', options: ['Ergonomic Mesh Chair', 'Leather Executive Chair', 'Stylish Accent Chair', 'Kneeling Chair', 'Balance Ball Chair'] },
      storage: { label: 'Storage', options: ['Built-in Bookshelves', 'Filing Cabinets', 'Floating Shelves', 'Credenza', 'Modular Storage Cubes'] },
    }
  },
  {
    name: 'Basement',
    subOptionKey: 'primaryUse',
    options: {
      primaryUse: {
        label: 'Primary Use',
        options: ['Home Theater', 'Home Gym', 'Game Room', 'Guest Suite', 'Unfinished Storage'],
      },
    },
    subOptions: {
      'Home Theater': {
        screenType: { label: 'Screen Type', options: ['120-inch Projector Screen', '85-inch OLED TV', 'Micro-LED Wall', 'Acoustically Transparent Screen', 'Retractable Screen'] },
        seatingStyle: { label: 'Seating Style', options: ['Plush Leather Recliners', 'Comfortable Sectional Sofa', 'Stadium Seating Platforms', 'Themed Cinema Chairs', 'Casual Bean Bags'] },
        soundSystem: { label: 'Sound System', options: ['Dolby Atmos Surround Sound', 'Hidden In-wall Speakers', 'High-end Tower Speakers', 'Soundbar with Subwoofer', 'Vintage Hi-Fi System'] },
        lighting: { label: 'Lighting', options: ['Dimmable Sconces', 'Starlight Ceiling Effect', 'LED Strip Accent Lighting', 'Automated Lighting Scenes', 'Floor-level Pathway Lights'] },
        wallScreenDisplay: { label: 'Wall & Screen Display', options: ['None', 'Horror Cinema Scenes', 'Cartoon Cinema Scenes', 'Superhero Cinema Scenes', 'Action Cinema Scenes', 'Comedy Cinema Scenes', 'Sports Cinema Scenes'] },
        wallTypeAndColor: { label: 'Wall Type & Color', options: ['Acoustic Fabric Panels in Deep Charcoal', 'Black Painted Drywall with Starry Night Ceiling', 'Rich Burgundy Velvet Curtains on all Walls', 'Exposed Brick Accent Wall, others in Matte Black', 'Dark Wood Paneling with Art Deco Sconces'] },
      },
      'Home Gym': {
        flooring: { label: 'Flooring', options: ['Rubber Gym Flooring', 'Interlocking Foam Tiles', 'Luxury Vinyl Plank', 'Artificial Turf Strip', 'Cork Flooring'] },
        cardio: { label: 'Cardio Equipment', options: ['Treadmill', 'Peloton Bike', 'Rowing Machine', 'Elliptical Trainer', 'Stair Climber'] },
        strength: { label: 'Strength Training', options: ['Free Weight Power Rack', 'Cable Crossover Machine', 'Dumbbell Set with Bench', 'Tonal Smart Gym', 'Kettlebell Collection'] },
        featureWall: { label: 'Feature Wall', options: ['Floor-to-ceiling Mirrors', 'Exposed Brick', 'Pegboard for Accessories', 'Inspirational Mural', 'Slat Wall System'] },
      },
      'Game Room': {
        mainAttraction: { label: 'Main Attraction', options: ['Pool Table', 'Vintage Arcade Machines', 'Skeeball Machine', 'Poker Table', 'VR Gaming Station'] },
        flooring: { label: 'Flooring', options: ['Low-pile Patterned Carpet', 'Stained Concrete', 'Checkerboard Tile', 'Durable Laminate', 'Hardwood with Area Rugs'] },
        seating: { label: 'Seating', options: ['Bar with Stools', 'Comfortable Couch', 'Gaming Chairs', 'Pub-style Booth', 'Modular Sectional'] },
        lighting: { label: 'Lighting', options: ['Neon Signs', 'Pendant Lights over Table', 'Track Lighting', 'Dimmable Recessed Lights', 'Colorful LED Strips'] },
      },
      'Guest Suite': {
        bedStyle: { label: 'Bed Style', options: ['Murphy Bed', 'Daybed with Trundle', 'Queen Size Platform Bed', 'Sleeper Sofa', 'Bunk Beds'] },
        flooring: { label: 'Flooring', options: ['Plush Carpeting', 'Engineered Hardwood', 'Laminate Flooring', 'Area Rug over Tile', 'Cozy Wool Carpet'] },
        bathroom: { label: 'Bathroom', options: ['No Bathroom', 'Full Ensuite with Shower', 'Half-bath (Powder Room)', 'Wet Bar with Sink', 'Small 3/4 Bath'] },
        kitchenette: { label: 'Kitchenette', options: ['None', 'Wet Bar with Mini-fridge', 'Small Kitchenette with Microwave', 'Full Kitchenette with Cooktop', 'Coffee Bar Station'] },
      },
      'Unfinished Storage': {
        shelving: { label: 'Shelving', options: ['Heavy-duty Metal Shelving', 'Built-in Wooden Shelves', 'Ceiling-mounted Racks', 'Modular Cube Storage', 'Industrial Pipe Shelving'] },
        flooring: { label: 'Flooring', options: ['Sealed Concrete', 'Painted Concrete', 'Interlocking Rubber Mats', 'Raised Subfloor Panels', 'No special treatment'] },
        lighting: { label: 'Lighting', options: ['Bare Bulb Fixtures', 'LED Shop Lights', 'Motion-activated Lights', 'Track Lighting', 'Natural Light from Window Wells'] },
        wallFinish: { label: 'Wall Finish', options: ['Unfinished Concrete', 'Painted Concrete Blocks', 'Framed with Insulation Visible', 'Basic Drywall (Unpainted)', 'Pegboard Walls'] },
      },
    },
  },
];