export const getGreeting = () => {
  const hour = new Date().getHours();
  const greeting =
    hour <= 11 ? "Good morning" : hour < 16 ? "Good afternoon" : "Good Evening";
  return `${greeting}, Welcome to Ogabassey. Your #1 device and gadgets plug. How may I assist you? Would you like to...`;
};

export const DEFAULT_CHIPS = [
  "Make an enquiry",
  "Make a purchase",
  "Make a complaint",
  "Swap device",
  "Track device",
];
