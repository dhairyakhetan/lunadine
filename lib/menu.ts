/* Luna Dine — menu data (from the printed Main Menu card).
   Edit prices/items here; the menu page and the dish counts update automatically.
   t: "v" = veg, "n" = non-veg, "x" = neutral (drinks etc.)
   Item format: [name, price, note?]  — price is a number in ₹ or "MRP". */

export type Diet = "v" | "n" | "x";
export type MenuItem = [name: string, price: number | "MRP", note?: string];
export type MenuGroup = { label: string; t: Diet; items: MenuItem[] };
export type MenuSection = { id: string; title: string; kicker: string; groups: MenuGroup[] };

export const MENU: MenuSection[] = [
  { id: "soup", title: "Soup", kicker: "To begin", groups: [
    { label: "Veg", t: "v", items: [
      ["Manchow Soup", 140], ["Hot & Sour Soup", 150], ["Sweet Corn Soup", 140],
      ["Veg Noodle Soup", 150], ["Veg Lemon Coriander Soup", 150] ]},
    { label: "Non-veg", t: "n", items: [
      ["Chicken Manchow Soup", 160], ["Chicken Hot & Sour Soup", 160], ["Chicken Sweet Corn Soup", 160],
      ["Chicken Noodle Soup", 160], ["Chicken Lemon Coriander Soup", 170], ["Thai Soup", 190] ]}
  ]},
  { id: "chinese-starter", title: "Chinese Starters", kicker: "Wok-tossed", groups: [
    { label: "Veg", t: "v", items: [
      ["Crispy Chilli Babycorn", 270], ["Mushroom Corn Salt & Pepper", 290], ["American Corn Salt & Pepper", 280, "8 pc"],
      ["Chilli Mushroom (Dry)", 280], ["Chilli Paneer (Dry)", 290, "8 pc"], ["Paneer 65", 280],
      ["Paneer Manchurian (Dry)", 270], ["Veg Manchurian (Dry)", 250], ["Schezwan Paneer (Dry)", 280],
      ["Kung Pao Paneer (Dry)", 280] ]},
    { label: "Non-veg", t: "n", items: [
      ["Chilli Chicken (Dry)", 280, "8 pc"], ["Chicken Manchurian (Dry)", 270, "8 pc"], ["Schezwan Chicken (Dry)", 280, "8 pc"],
      ["Chicken Lollipop", 260, "6 pc"], ["Drums of Heaven", 280, "6 pc"], ["Crispy Chicken", 270],
      ["Dragon Chicken", 290, "8 pc"], ["Kung Pao Chicken (Dry)", 290], ["Fish Finger", 380, "6 pc"],
      ["Chilli Fish (Dry)", 380, "6 pc"], ["Pan Fry Chilli Fish", 390, "8 pc"], ["Golden Fried Prawn", 400, "6 pc"],
      ["Chilli Prawn (Dry)", 380, "6 pc"], ["Prawn Manchurian (Dry)", 380], ["Panko Fried Prawns", 390, "6 pc"] ]}
  ]},
  { id: "noodles", title: "Noodles", kicker: "Chinese main course", groups: [
    { label: "Veg", t: "v", items: [
      ["Veg Hakka Noodles", 200], ["Veg Schezwan Noodles", 230], ["Veg Pan Fry Noodles", 250],
      ["Veg Continental Noodles", 240], ["Veg Hong Kong Noodles", 240], ["Veg American Chopsuey", 250],
      ["Chilli Garlic Noodles", 230], ["Burnt Garlic Noodles", 240], ["Veg Thukpa", 250], ["Mei Fun Noodles", 270] ]},
    { label: "Non-veg", t: "n", items: [
      ["Chicken Hakka Noodles", 250], ["Mix Hakka Noodles", 280], ["Egg Hakka Noodles", 220],
      ["Schezwan Chicken Noodles", 280], ["Schezwan Mix Noodles", 310], ["Schezwan Egg Noodles", 250],
      ["Pan Fry Chicken Noodles", 290], ["Pan Fry Mix Noodles", 320], ["Pan Fry Egg Noodles", 260],
      ["Continental Chicken Noodles", 290], ["Continental Mix Noodles", 320], ["Continental Egg Noodles", 260],
      ["Hong Kong Chicken Noodles", 300], ["Hong Kong Mix Noodles", 350], ["Hong Kong Egg Noodles", 270],
      ["Chopsuey Chicken Noodles", 280], ["Chopsuey Mix Noodles", 320], ["Thukpa Chicken", 290],
      ["Thukpa Mix", 330], ["Mei Fun Mix Noodles", 300], ["Pad Thai Chicken Noodles", 300], ["Pad Thai Mix Noodles", 350] ]}
  ]},
  { id: "rice", title: "Fried Rice", kicker: "Chinese main course", groups: [
    { label: "Veg", t: "v", items: [
      ["Veg Fried Rice", 180], ["Veg Schezwan Rice", 210], ["Veg Hong Kong Fried Rice", 230],
      ["Classic Indo-Chinese Fried Rice", 220], ["Mushroom Fried Rice", 230], ["Moon Fan Fried Rice", 230],
      ["Singapuri Fried Rice", 220], ["Thai Basil Fried Rice", 240], ["Korean Kimchi Fried Rice", 250] ]},
    { label: "Non-veg", t: "n", items: [
      ["Chicken Fried Rice", 260], ["Egg Fried Rice", 240], ["Mixed Fried Rice", 290],
      ["Chicken Schezwan Rice", 270], ["Egg Schezwan Fried Rice", 250], ["Mix Schezwan Fried Rice", 310],
      ["Chicken Hong Kong Fried Rice", 280], ["Mix Hong Kong Fried Rice", 320],
      ["Classic Indo-Chinese Fried Rice (Chicken)", 280], ["Classic Indo-Chinese Fried Rice (Mix)", 320],
      ["Moon Fan Mix Fried Rice", 300], ["Singapuri Chicken Fried Rice", 270], ["Singapuri Mix Fried Rice", 310],
      ["Thai Basil Chicken Fried Rice", 280], ["Thai Basil Mix Fried Rice", 320],
      ["Korean Kimchi Chicken Fried Rice", 280], ["Korean Kimchi Mix Fried Rice", 320] ]}
  ]},
  { id: "chinese-gravy", title: "Chinese Side Dishes", kicker: "In gravy", groups: [
    { label: "Veg", t: "v", items: [
      ["Veg Manchurian (Gravy)", 250, "8 pc"], ["Paneer Manchurian (Gravy)", 280, "8 pc"], ["Chilli Paneer (Gravy)", 300, "8 pc"],
      ["Schezwan Paneer (Gravy)", 290, "8 pc"], ["Salanto Paneer (Gravy)", 290, "8 pc"] ]},
    { label: "Chicken", t: "n", items: [
      ["Chilli Chicken (Gravy)", 290, "8 pc"], ["Chicken Manchurian (Gravy)", 280, "8 pc"], ["Schezwan Chicken (Gravy)", 290, "8 pc"] ]},
    { label: "Fish", t: "n", items: [
      ["Chilli Fish", 380], ["Fish Manchurian", 370], ["Hong Kong Fish", 390], ["Salanto Fish", 390] ]},
    { label: "Prawn", t: "n", items: [
      ["Chilli Prawn", 410], ["Prawn Manchurian", 400], ["Hong Kong Prawn", 420], ["Salanto Prawn", 420] ]}
  ]},
  { id: "momos", title: "Momos", kicker: "Six to a plate", groups: [
    { label: "Veg", t: "v", items: [
      ["Veg Steam Momo", 120, "6 pc"], ["Veg Fry Momo", 130, "6 pc"], ["Veg Pan Fry Momo", 140, "6 pc"] ]},
    { label: "Non-veg", t: "n", items: [
      ["Chicken Steam Momo", 180, "6 pc"], ["Chicken Fry Momo", 190, "6 pc"], ["Chicken Pan Fry Momo", 210, "6 pc"] ]}
  ]},
  { id: "tandoor", title: "Indian Starters", kicker: "From the tandoor", groups: [
    { label: "Veg", t: "v", items: [
      ["Paneer Tikka", 310, "6 pc"], ["Hariyali Paneer Tikka", 310], ["Paneer Malai Cheese Tikka", 350, "6 pc"],
      ["Hara Bhara Kabab", 260, "6 pc"], ["Tandoori Mushroom", 280] ]},
    { label: "Non-veg", t: "n", items: [
      ["Tandoori Chicken — Full", 520], ["Tandoori Chicken — Half", 270], ["Chicken Afghani — Full", 540],
      ["Chicken Afghani — Half", 280], ["Chicken Tikka", 300, "6 pc"], ["Chicken Malai Kabab", 340, "6 pc"],
      ["Chicken Reshmi Kabab", 320, "6 pc"], ["Chicken Seekh Kabab", 280, "6 pc"], ["Chicken Hariyali Kabab", 300, "6 pc"],
      ["Chicken Kalmi Kabab", 340, "4 pc"], ["Chicken Tangri Kabab", 340, "4 pc"], ["Ajwaini Fish Tikka", 350, "6 pc"],
      ["Fish Hariyali", 360, "6 pc"], ["Pomfret Tandoori", 400, "2 pc"], ["Jhinga Kabab (Prawn)", 400, "8 pc"] ]}
  ]},
  { id: "biryani", title: "Biryani & Pulao", kicker: "Indian main course", groups: [
    { label: "Biryani", t: "n", items: [
      ["Chicken Biryani", 240], ["Chicken Special Biryani", 310], ["Mutton Biryani", 330],
      ["Mutton Biryani Special", 400], ["Egg Biryani", 200] ]},
    { label: "Rice & pulao", t: "v", items: [
      ["Steam Rice", 180], ["Jeera Rice", 200], ["Veg Pulao", 220], ["Peas Pulao", 210],
      ["Paneer Pulao", 220], ["Kashmiri Pulao", 250] ]}
  ]},
  { id: "indian-veg", title: "Indian Curries — Veg", kicker: "Indian side dishes", groups: [
    { label: "Veg", t: "v", items: [
      ["Mix Veg", 240], ["Veg Jalfrezi", 270], ["Veg Kolhapuri", 280], ["Veg Dewani Handi", 280],
      ["Paneer Butter Masala", 280], ["Palak Paneer", 270], ["Kadhai Paneer", 290], ["Paneer Do Pyaza", 280],
      ["Green Peas Masala", 240], ["Paneer Lababdar", 290], ["Shahi Paneer", 310], ["Paneer Tikka Butter Masala", 350],
      ["Paneer Pasanda", 340], ["Mushroom Masala", 250], ["Plain Dal", 120], ["Dal Fry", 180],
      ["Yellow Dal Ghee Tadka", 220], ["Dal Makhani", 350] ]}
  ]},
  { id: "indian-nonveg", title: "Indian Curries — Non-Veg", kicker: "Indian side dishes", groups: [
    { label: "Chicken", t: "n", items: [
      ["Chicken Kosha", 280, "4 pc w/b"], ["Chicken Masala", 300, "4 pc w/b"], ["Chicken Do Pyaza", 290, "4 pc w/b"],
      ["Kadhai Chicken", 290, "4 pc w/b"], ["Tandoori Chicken Butter Masala — Full", 600, "8 pc"],
      ["Tandoori Chicken Butter Masala — Half", 330, "4 pc"], ["Chicken Tikka Masala", 330, "6 pc b/l"],
      ["Chicken Tikka Lababdar", 340, "6 pc b/l"], ["Chicken Reshmi Butter Masala", 350, "6 pc b/l"],
      ["Chicken Bharta", 330, "b/l"], ["Handi Chicken", 420, "6 pc w/b"] ]},
    { label: "Mutton", t: "n", items: [
      ["Mutton Kosha", 400, "4 pc"], ["Mutton Masala", 420, "4 pc"], ["Mutton Do Pyaza", 410, "4 pc"],
      ["Kadhai Mutton", 410, "4 pc"], ["Mutton Rogan Josh", 400, "4 pc"], ["Mutton Handi", 580, "6 pc"],
      ["Mutton Keema Masala", 520], ["Keema Matar", 480], ["Mutton Bhuna", 580, "6 pc"] ]}
  ]},
  { id: "bengali", title: "Fish — Bengali", kicker: "Home-style, Bengal-proud", groups: [
    { label: "Fish & Prawn", t: "n", items: [
      ["Fish Curry (Katla)", 210, "2 pc"], ["Fish Kalia (Katla)", 220, "2 pc"], ["Fish Fry (Katla)", 200, "2 pc"],
      ["Sorshe Fish (Katla)", 250, "2 pc"], ["Pomfret Fry", 400, "2 pc"], ["Pomfret Curry", 440, "2 pc"],
      ["Sorshe Pomfret", 440, "2 pc"], ["Fish Masala (Basa)", 380, "4 pc"], ["Prawn Malai Curry", 480, "6 pc"],
      ["Prawn Masala", 470, "6 pc"] ]}
  ]},
  { id: "breads", title: "Indian Breads", kicker: "Fresh from the clay oven", groups: [
    { label: "Breads", t: "v", items: [
      ["Plain Tandoor Roti", 55], ["Butter Tandoor Roti", 65], ["Plain Naan", 70], ["Butter Naan", 80],
      ["Lachha Paratha", 70], ["Paneer Kulcha", 85], ["Masala Kulcha", 85], ["Cheese Naan", 110], ["Cheese Garlic Naan", 120] ]}
  ]},
  { id: "salad", title: "Salad, Raita & Curd", kicker: "On the side", groups: [
    { label: "Salad", t: "v", items: [
      ["Onion Salad", 80], ["Tomato Salad", 90], ["Cucumber Salad", 150], ["Green Salad", 120], ["Roasted Papad", 50, "2 pc"] ]},
    { label: "Raita & Curd", t: "v", items: [
      ["Plain Curd", 60], ["Plain Raita", 80], ["Mix Veg Raita", 100], ["Boondi Raita", 120], ["Pineapple Raita", 120] ]}
  ]},
  { id: "mocktails", title: "Mocktails", kicker: "Shaken, stirred, sparkling", groups: [
    { label: "Mocktails", t: "x", items: [
      ["Fresh Lime Soda", 110], ["Fresh Lime Water", 95], ["Masala Cola", 90], ["Lemon / Peach Iced Tea", 160],
      ["Classic Mojito", 180], ["Green Apple Mojito", 185], ["Watermelon Mojito", 180], ["Strawberry Mojito", 190],
      ["Kiwi Mojito", 185], ["Orange Basil Mojito", 190], ["Blue Lagoon", 180], ["Spicy Mango", 190],
      ["Nice n Naughty", 195], ["Royal Hummer", 190], ["Virgin Piña Colada", 195] ]}
  ]},
  { id: "shakes", title: "Shakes & Soft Drinks", kicker: "Cold & creamy", groups: [
    { label: "Shakes", t: "x", items: [
      ["Kit Kat Shake", 210], ["Oreo Shake", 200], ["Strawberry Shake", 180], ["Chocolate Milkshake", 190], ["Cold Coffee", 200] ]},
    { label: "Soft Drinks", t: "x", items: [
      ["Sprite (300 ml can)", "MRP"], ["Coca-Cola (300 ml can)", "MRP"], ["Thums Up (300 ml can)", "MRP"],
      ["Fanta (300 ml can)", "MRP"], ["Diet Coke (330 ml can)", "MRP"], ["Red Bull", "MRP"] ]}
  ]},
  { id: "desserts", title: "Desserts", kicker: "A sweet full stop", groups: [
    { label: "Desserts", t: "v", items: [
      ["Tutti Frutti", 200], ["Sundae Tutti Frutti Brownie", 210], ["Chocolate Ice Cream", 100], ["Brownie with Ice Cream", 160] ]}
  ]}
];

export const TOTAL_DISHES = MENU.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.items.length, 0), 0);
export const TOTAL_SECTIONS = MENU.length;
