export const GENDERS = [
    { key: 'male', title: 'Мужской', art: '/hero/male.png', desc: 'Классическая мужская модель героя.' },
    { key: 'female', title: 'Женский', art: '/hero/female.png', desc: 'Классическая женская модель героя.' },
];

export function isValidGender(key?: string | null) {
    return key === 'male' || key === 'female';
}
