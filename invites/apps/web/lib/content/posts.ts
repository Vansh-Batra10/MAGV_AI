/** Blog posts (SEO). Plain data so no MDX toolchain is needed; see DECISIONS. */
export const POSTS = [
  {
    slug: "wedding-invitation-wording-in-hindi", title: "Wedding invitation wording in Hindi (with English and Hinglish)", date: "2026-11-15",
    body: [
      "Elders read the first two lines and decide how they feel about the whole card. Formal Hindi wording that names the families first never goes wrong.",
      "सादर आमंत्रण — हमारे परिवारों के आशीर्वाद से, आपको {वर} और {वधू} के शुभ विवाह में सादर आमंत्रित करते हैं।",
      "For friends, a warm Hinglish line works better: “Parivaar ke aashirwad ke saath, aapka intezaar rahega.” Keep the playful lines for the group chat; they can read as rude to Nani.",
      "With personal links you don't have to choose: set formal Hindi for the family group and Hinglish for friends, and each guest sees the wording meant for them.",
    ],
  },
  {
    slug: "digital-invite-per-function", title: "Should every function have its own invite?", date: "2026-11-10",
    body: ["Most families invite different people to the haldi, mehendi, sangeet and reception. A per-guest link shows each guest only their functions, so no one feels left out and no one turns up uninvited.", "Your caterer gets headcounts per function with veg, Jain and non-veg numbers."],
  },
] as const;
