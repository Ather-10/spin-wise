export type Preset = { slug: string; name: string; title: string; desc: string; entries: string[] };

export const presets: Preset[] = [
  { slug: 'animal-wheel', name: 'Animal Wheel', title: 'Random Animal Generator Wheel',
    desc: 'Spin to pick a random animal. Great for drawing games, classrooms and trivia.',
    entries: ['Lion', 'Elephant', 'Penguin', 'Dolphin', 'Giraffe', 'Panda', 'Kangaroo', 'Wolf', 'Owl', 'Tiger'] },
  { slug: 'country-picker-wheel', name: 'Country Picker Wheel', title: 'Random Country Generator Wheel',
    desc: 'Spin to pick a random country. Perfect for geography practice and travel ideas.',
    entries: ['Japan', 'Brazil', 'Canada', 'Egypt', 'Italy', 'India', 'Mexico', 'Norway', 'Kenya', 'Australia'] },
  { slug: 'fast-food-decision-maker', name: 'Fast Food Decision Maker', title: 'Fast Food Decision Maker Wheel',
    desc: 'Cannot decide what to eat? Spin the wheel and let it choose your fast food.',
    entries: ['Burger', 'Pizza', 'Fried chicken', 'Tacos', 'Sandwich', 'Noodles', 'Wrap', 'Fries'] },
  { slug: 'restaurant-wheel', name: 'Wheel of Restaurant', title: 'Restaurant Picker Wheel',
    desc: 'Pick where to eat tonight by cuisine. Add your own favorite places.',
    entries: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese', 'BBQ', 'Mediterranean'] },
  { slug: 'random-us-state-generator', name: 'Random US State Generator', title: 'Random US State Generator',
    desc: 'Spin to pick a random US state. Add all 50 states to the box for the full wheel.',
    entries: ['Texas', 'Ohio', 'Maine', 'Utah', 'Florida', 'Oregon', 'Nevada', 'Georgia', 'Alaska', 'Vermont'] },
  { slug: 'random-us-city-generator', name: 'Random US City Generator', title: 'Random US City Generator',
    desc: 'Spin to pick a random US city for a trip idea or a quiz.',
    entries: ['Chicago', 'Denver', 'Austin', 'Seattle', 'Miami', 'Boston', 'Phoenix', 'Nashville'] },
  { slug: 'movie-night-picker', name: 'Movie Night Picker', title: 'Movie Genre Picker Wheel',
    desc: 'Cannot agree on a movie? Spin for the genre and settle it fairly.',
    entries: ['Comedy', 'Action', 'Horror', 'Romance', 'Sci-fi', 'Animation', 'Thriller', 'Documentary'] },
  { slug: 'yes-or-no-wheel', name: 'Yes or No Wheel', title: 'Yes or No Decision Wheel',
    desc: 'A quick yes or no answer. Spin and let the wheel decide.',
    entries: ['Yes', 'No', 'Yes', 'No', 'Yes', 'No'] },
];
export const getPreset = (slug: string) => presets.find((p) => p.slug === slug);
