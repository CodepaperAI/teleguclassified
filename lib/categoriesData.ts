export interface SubCategory {
    label: string;
    subItems: string[];
}

export interface Category {
    id: string;
    label: string;
    icon: string;
    subCategories?: SubCategory[];
}

export const CATEGORIES: Category[] = [
    {
        id: "housing", label: "Real Estate", icon: "🏠", subCategories: [
            {
                label: "For Rent",
                subItems: [
                    "Long Term Rentals",
                    "Short Term Rentals",
                    "Room Rentals & Roommates",
                    "Storage & Parking for Rent",
                    "Commercial & Office Space for Rent"
                ]
            },
            {
                label: "For Sale",
                subItems: [
                    "Land for Sale"
                ]
            }
        ]
    },
    {
        id: "jobs", label: "Jobs", icon: "💼", subCategories: [
            { label: "Accounting & Management", subItems: [] },
            { label: "Child Care", subItems: [] },
            { label: "Bar, Food & Hospitality", subItems: [] },
            { label: "Cleaning & Housekeeping", subItems: [] },
            { label: "Construction & Trades", subItems: [] },
            { label: "Customer Service", subItems: [] },
            { label: "Cannabis Sector", subItems: [] },
            { label: "Drivers & Security", subItems: [] },
            { label: "General Labour", subItems: [] },
            { label: "Graphic & Web Design", subItems: [] },
            { label: "Healthcare", subItems: [] },
            { label: "Hair Stylist & Salon", subItems: [] },
            { label: "Office Manager & Receptionist", subItems: [] },
            { label: "Part Time & Students", subItems: [] },
            { label: "Programmers & Computer", subItems: [] },
            { label: "Sales & Retail Sales", subItems: [] },
            { label: "TV, Media, & Fashion", subItems: [] },
            { label: "Other", subItems: [] }
        ]
    },
    {
        id: "buysell",
        label: "Buy & Sell",
        icon: "🏷️",
        subCategories: [
            { label: "Arts & Collectibles", subItems: ["Antiques", "Paintings & Prints", "Coins & Paper Money", "Stamps", "Sports Memorabilia", "Vintage Items"] },
            { label: "Clothing", subItems: ["Men's", "Women's", "Kids & Baby", "Indian Ethnic Wear (Saris, Lehengas, Kurtas)", "Wedding Wear", "Winter Wear"] },
            { label: "Furniture", subItems: ["Beds & Mattresses", "Coffee Tables", "Desks", "Dining Tables & Chairs", "Sofas & Couches", "Wardrobes & Cabinets"] },
            { label: "Home - Indoor", subItems: ["Decor & Accents", "Lighting", "Rugs & Carpets", "Mirrors", "Bedding & Linens", "Curtains & Blinds"] },
            { label: "Home - Outdoor", subItems: ["Patio Furniture", "BBQ & Grills", "Lawn Mowers", "Snow Blowers", "Garden Decor", "Plants & Seeds"] },
            { label: "Home Appliances", subItems: ["Fridges & Freezers", "Washers & Dryers", "Dishwashers", "Microwaves", "Indian Kitchen (Wet Grinders, Mixers)"] },
            { label: "Home Renovation", subItems: ["Flooring", "Kitchen Cabinets", "Bathroom Fixtures", "Windows & Doors", "Paint & Supplies"] },
            { label: "Electronics", subItems: ["Headphones", "Smart Home Tech", "Speakers & Home Theater", "Batteries & Power", "GPS & Navigation"] },
            { label: "Computers", subItems: ["Laptops", "Desktops", "Apple/Macs", "Monitors", "Servers"] },
            { label: "Computer Accessories", subItems: ["Keyboards & Mice", "Printers & Scanners", "Components (RAM, GPU)", "Cables & Adapters", "Laptop Bags"] },
            { label: "Phones", subItems: ["iPhones", "Android Phones", "Smart Watches", "Cases & Screen Protectors", "Chargers & Cables"] },
            { label: "TVs & Video", subItems: ["Smart TVs", "Projectors", "Streaming Devices (Roku, FireStick)", "DVD/Blu-ray Players"] },
            { label: "Audio", subItems: ["Bluetooth Speakers", "Home Theater Systems", "Receivers & Amplifiers", "iPods & MP3 Players"] },
            { label: "Video Games", subItems: ["PlayStation", "Xbox", "Nintendo", "PC Games", "Retro Gaming", "VR Headsets"] },
            { label: "Cameras & Camcorders", subItems: ["DSLRs", "Mirrorless", "Action Cams (Gopro)", "Lenses", "Tripods & Lighting"] },
            { label: "Toys & Games", subItems: ["Action Figures", "Board Games", "Dolls", "LEGO & Building Sets", "Remote Control Toys"] },
            { label: "Baby Items", subItems: ["Strollers", "High Chairs", "Cribs & Bassinets", "Diapering", "Toys (0-24 months)"] },
            { label: "Books", subItems: ["Fiction", "Non-Fiction", "Textbooks", "Children's Books", "Telugu Literature & Magazines"] },
            { label: "CDs, DVDs & Blu-ray", subItems: ["Movies", "Music Albums", "Documentary", "Telugu Movie Collections"] },
            { label: "Jewellery & Watches", subItems: ["Watches", "Bracelets", "Necklaces", "Rings", "Traditional Indian Gold/Temple Jewellery"] },
            { label: "Health & Special Needs", subItems: ["Vitamins & Supplements", "Fitness Equipment", "Mobility Aids (Wheelchairs)", "Yoga Gear"] },
            { label: "Sporting Goods", subItems: ["Hockey", "Soccer", "Basketball", "Cricket Gear", "Golf", "Camping & Hiking"] },
            { label: "Bikes", subItems: ["Road Bikes", "Mountain Bikes", "Electric Bikes", "Kids' Bikes", "Bike Parts & Accessories"] },
            { label: "Musical Instruments", subItems: ["Guitars", "Pianos & Keyboards", "Drums", "Harmonium & Tabla", "Violins"] },
            { label: "Hobbies & Crafts", subItems: ["Sewing & Knitting", "Model Building", "Scrapbooking", "Painting Supplies"] },
            { label: "Bags & Luggage", subItems: ["Backpacks", "Suitcases", "Handbags", "Wallets", "Briefcases"] },
            { label: "Tools", subItems: ["Power Tools", "Hand Tools", "Ladders", "Tool Boxes", "Generators"] },
            { label: "Business & Industrial", subItems: ["Office Furniture", "Restaurant Equipment", "Heavy Machinery", "Retail Displays"] },
            { label: "Free Stuff", subItems: ["Furniture", "Clothing", "Household Items", "Moving Boxes"] },
            { label: "Garage Sales", subItems: ["Estate Sales", "Moving Sales"] },
            { label: "Tickets", subItems: ["Concerts", "Sports", "Telugu Movie Premieres"] },
            { label: "Other", subItems: ["Miscellaneous Items", "Rare Finds"] }
        ]
    },
    {
        id: "services", label: "Services", icon: "🛠️", subCategories: [
            { label: "Childcare & Nanny", subItems: [] },
            { label: "Cleaners & Cleaning", subItems: [] },
            { label: "Entertainment", subItems: [] },
            { label: "Financial & Legal", subItems: [] },
            { label: "Fitness & Personal Trainer", subItems: [] },
            { label: "Food & Catering", subItems: [] },
            { label: "Health & Beauty", subItems: [] },
            { label: "Moving & Storage", subItems: [] },
            { label: "Music Lessons", subItems: [] },
            { label: "Photography & Video", subItems: [] },
            {
                label: "Skilled Trades",
                subItems: [
                    "Appliance Repair & Installation",
                    "Brick, Masonry & Concrete",
                    "Carpentry, Crown Moulding & Trimwork",
                    "Drywall & Stucco Removal",
                    "Electrician",
                    "Excavation, Demolition & Waterproofing",
                    "Fence, Deck, Railing & Siding",
                    "Flooring",
                    "Garage Door",
                    "Heating, Ventilation & Air Conditioning",
                    "Insulation",
                    "Interlock, Paving & Driveways",
                    "Lawn, Tree Maintenance & Eavestrough",
                    "Painters & Painting",
                    "Phone, Network, Cable & Home-wiring",
                    "Plumbing",
                    "Renovations, General Contracting & Handyman",
                    "Roofing",
                    "Snow Removal & Property Maintenance",
                    "Welding",
                    "Windows & Doors",
                    "Other"
                ]
            },
            { label: "Tutors & Languages", subItems: [] },
            { label: "Wedding", subItems: [] },
            { label: "Travel & Vacations", subItems: [] },
            { label: "Real Estate", subItems: ["Mortgage Agent", "Home Inspector"] },
            { label: "Other", subItems: [] }
        ]
    },

    {
        id: "events", label: "Events", icon: "📅", subCategories: [
            { label: "Concerts", subItems: [] },
            { label: "Festivals", subItems: [] }
        ]
    },
];

export function findCategoryPath(query: string) {
    if (!query) return null;
    const q = query.toLowerCase();

    for (const cat of CATEGORIES) {
        // Match main category
        if (cat.label.toLowerCase() === q || cat.id === q) {
            return { category: cat };
        }

        if (cat.subCategories) {
            for (const sub of cat.subCategories) {
                // Match subcategory
                if (sub.label.toLowerCase() === q) {
                    return { category: cat, subCategory: sub };
                }

                // Match sub-item
                if (sub.subItems.some(item => item.toLowerCase() === q)) {
                    return { category: cat, subCategory: sub, subItem: q };
                }
            }
        }
    }
    return null;
}
