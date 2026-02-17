/**
 * Module/World Configuration
 * Defines all 9 modules with their chambers based on chemistry_questions.json
 */

export interface Chamber {
  id: string;
  name: string;
  topic: string;
  description: string;
}

export interface Module {
  id: number;
  name: string;
  description: string;
  chambers: Chamber[];
  color: string;
  icon: string;
}

export const MODULES: Module[] = [
  {
    id: 1,
    name: "Module 1: Properties & Structure of Matter",
    description: "Atomic structure, periodic table, bonding, and intermolecular forces",
    color: "from-blue-500 to-cyan-500",
    icon: "Beaker",
    chambers: [
      { id: "properties-of-matter", name: "Properties of Matter", topic: "Properties of Matter", description: "Physical and chemical properties, changes of state" },
      { id: "atomic-structure-and-periodicity", name: "Atomic Structure", topic: "Atomic structure", description: "Atoms, subatomic particles, periodic trends" },
      { id: "bonding", name: "Chemical Bonding", topic: "Chemical bonding", description: "Ionic, covalent, and metallic bonding" },
      { id: "intermolecular-forces", name: "Intermolecular Forces", topic: "Intermolecular forces", description: "Hydrogen bonding, dispersion forces, dipole-dipole" },
    ]
  },
  {
    id: 2,
    name: "Module 2: Introduction to Quantitative Chemistry",
    description: "Moles, stoichiometry, concentrations, and gas laws",
    color: "from-green-500 to-emerald-500",
    icon: "Beaker",
    chambers: [
      { id: "the-mole-concept", name: "The Mole Concept", topic: "The Mole Concept", description: "Avogadro's constant, molar mass, calculations" },
      { id: "chemical-reactions-stoichiometry", name: "Stoichiometry", topic: "Stoichiometry", description: "Balancing equations, mole ratios, limiting reagents" },
      { id: "concentration-molarity", name: "Concentration & Molarity", topic: "Concentration", description: "Molarity, dilution, volumetric analysis" },
      { id: "gas-laws", name: "Gas Laws", topic: "Gas Laws", description: "Boyle's, Charles', Gay-Lussac's laws, ideal gas equation" },
    ]
  },
  {
    id: 3,
    name: "Module 3: Reactive Chemistry",
    description: "Types of reactions, rates, and energy changes",
    color: "from-orange-500 to-red-500",
    icon: "Flame",
    chambers: [
      { id: "chemical-reactions", name: "Types of Reactions", topic: "Types of Reactions", description: "Synthesis, decomposition, displacement reactions" },
      { id: "rates-of-reaction", name: "Reaction Rates", topic: "Rates of Reaction", description: "Collision theory, factors affecting rate" },
      { id: "predicting-reactions-metals", name: "Predicting Reactions", topic: "Predicting Reactions", description: "Activity series, metal reactivity" },
      { id: "redox-and-galvanic", name: "Redox & Galvanic Cells", topic: "Redox", description: "Oxidation, reduction, electrochemical cells" },
    ]
  },
  {
    id: 4,
    name: "Module 4: Drivers of Reactions",
    description: "Enthalpy, entropy, Gibbs free energy, and equilibrium",
    color: "from-purple-500 to-pink-500",
    icon: "Zap",
    chambers: [
      { id: "energy-changes", name: "Energy Changes", topic: "Energy Changes", description: "Exothermic and endothermic reactions" },
      { id: "enthalpy-and-hess-law", name: "Enthalpy & Hess's Law", topic: "Enthalpy", description: "Heat of reaction, calorimetry, Hess cycles" },
      { id: "entropy-and-gibbs", name: "Entropy & Gibbs", topic: "Entropy", description: "Spontaneity, Gibbs free energy calculations" },
      { id: "photosynthesis-and-respiration", name: "Photosynthesis & Respiration", topic: "Biological Energy", description: "Energy in biological systems" },
    ]
  },
  {
    id: 5,
    name: "Module 5: Equilibrium & Acid Reactions",
    description: "Chemical equilibrium, acids, bases, and pH",
    color: "from-yellow-500 to-amber-500",
    icon: "Droplet",
    chambers: [
      { id: "equilibrium-principles", name: "Equilibrium Principles", topic: "Equilibrium", description: "Le Chatelier's principle, dynamic equilibrium" },
      { id: "equilibrium-constants", name: "Equilibrium Constants", topic: "Equilibrium Constants", description: "Kc, Kp calculations" },
      { id: "acid-base-theory", name: "Acid-Base Theory", topic: "Acids & Bases", description: "Brønsted-Lowry, conjugate pairs" },
      { id: "ph-and-indicators", name: "pH & Indicators", topic: "pH", description: "pH calculations, titrations, indicators" },
    ]
  },
  {
    id: 6,
    name: "Module 6: Organic Chemistry",
    description: "Organic nomenclature, functional groups, and reactions",
    color: "from-teal-500 to-cyan-500",
    icon: "Atom",
    chambers: [
      { id: "m6-c1", name: "Organic Nomenclature", topic: "Organic Nomenclature", description: "IUPAC naming, structural formulas" },
      { id: "properties-of-acids-and-bases", name: "Organic Acids & Bases", topic: "Organic Acids", description: "Carboxylic acids, amines, pH in organic compounds" },
      { id: "quantitative-analysis", name: "Quantitative Analysis", topic: "Analysis", description: "Calculations in organic chemistry" },
      { id: "dissociation-constants", name: "Dissociation Constants", topic: "Ka & Kb", description: "Weak acid and base calculations" },
    ]
  },
  {
    id: 7,
    name: "Module 7: Organic Chemistry - Reactions",
    description: "Alcohols, functional groups, and organic reactions",
    color: "from-indigo-500 to-purple-500",
    icon: "Beaker",
    chambers: [
      { id: "m7-c1", name: "Chemical Equilibrium", topic: "Equilibrium", description: "Advanced equilibrium concepts" },
      { id: "functional-groups", name: "Functional Groups", topic: "Functional Groups", description: "Alkenes, alkynes, alcohols, haloalkanes" },
      { id: "alcohols-and-reactions", name: "Alcohols & Reactions", topic: "Alcohols", description: "Preparation and reactions of alcohols" },
      { id: "nomenclature-and-hydrocarbons", name: "Hydrocarbons", topic: "Hydrocarbons", description: "Alkanes, alkenes, alkynes, benzene" },
    ]
  },
  {
    id: 8,
    name: "Module 8: Applying Chemical Ideas",
    description: "Analytical techniques and quantitative chemistry",
    color: "from-rose-500 to-pink-500",
    icon: "Microscope",
    chambers: [
      { id: "m8-c1", name: "Radioactivity", topic: "Radioactivity", description: "Nuclear decay, half-life, applications" },
      { id: "m8-c2", name: "Nuclear Chemistry", topic: "Nuclear Chemistry", description: "Nuclear equations, fission, fusion" },
      { id: "analysis-of-inorganic-substances", name: "Inorganic Analysis", topic: "Inorganic Analysis", description: "Qualitative and quantitative analysis" },
      { id: "analysis-of-organic-substances", name: "Organic Analysis", topic: "Organic Analysis", description: "Testing for organic functional groups" },
    ]
  },
  {
    id: 9,
    name: "Module 9: Final Challenge",
    description: "Boss battle - Ultimate chemistry mastery test",
    color: "from-red-600 to-orange-600",
    icon: "Skull",

    chambers: [
      { id: "boss-battle", name: "Chemical Overlord", topic: "Boss Battle", description: "Defeat the Chemical Overlord!" },
    ]
  },
];

export function getModuleById(id: number): Module | undefined {
  return MODULES.find(m => m.id === id);
}

export function getChamberById(moduleId: number, chamberId: string): Chamber | undefined {
  const module = getModuleById(moduleId);
  return module?.chambers.find(c => c.id === chamberId);
}

export function getAllChambers(): { module: Module; chamber: Chamber }[] {
  const result: { module: Module; chamber: Chamber }[] = [];
  for (const module of MODULES) {
    for (const chamber of module.chambers) {
      result.push({ module, chamber });
    }
  }
  return result;
}
