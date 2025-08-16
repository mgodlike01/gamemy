export const CHARACTERS = [
    {
        key: 'warrior',
        title: 'Воин',
        art: '/hero/warrior.png',
        desc: 'Сбалансированный боец ближнего боя.',
    },
    {
        key: 'rogue',
        title: 'Плут',
        art: '/hero/rogue.png',
        desc: 'Высокая скорость, критические удары.',
    },
];

export function isValidCharacter(key?: string | null) {
    return !!CHARACTERS.find(c => c.key === key);
}
