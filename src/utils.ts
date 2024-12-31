import pako from 'pako'
import weakPasswordBin from './assets/weak-password.bin?url'
import type { SecurityItem } from './App.vue'

let weakPasswordList: string[] = []

fetch(weakPasswordBin).then(res => res.arrayBuffer()).then(buffer => {
    const weakPasswords = pako.inflate(buffer)
    const decoder = new TextDecoder()
    weakPasswordList = decoder.decode(weakPasswords).split("\n")
})

export const isWeakPassword = (password: string): number => {
    return weakPasswordList.indexOf(password)
}

export const checkSecurity = (password: string): SecurityItem[] => {
    const security: SecurityItem[] = []
    const weakIndex = isWeakPassword(password)
    if (weakIndex !== -1) {
        security.push({
            type: "error",
            text: `第${weakIndex + 1}个已知的弱密码`,
            desc: `这是一个已知的弱密码，可以在几秒内被迅速爆破`
        })
    }
    if (password.length < 8) {
        security.push({
            type: "error",
            text: "密码长度小于8位",
            desc: "这将导致密码能在极短的时间内被破解"
        })
    }
    if (/^[0-9]+$/.test(password)) {
        security.push({
            type: "error",
            text: "纯数字密码",
            desc: "这样的密码很容易被猜测"
        })
    }
    if (/^[a-z]+$/.test(password)) {
        security.push({
            type: "error",
            text: "纯小写字母密码",
            desc: "这样的密码很容易被猜测"
        })
    } else if (/^[A-Z]+$/.test(password)) {
        security.push({
            type: "error",
            text: "纯大写字母密码",
            desc: "这样的密码很容易被猜测"
        })
    } else if (/^[a-z0-9]+$/.test(password) || /^[A-Z0-9]+$/.test(password)) {
        security.push({
            type: "warn",
            text: "密码构成较为简单",
            desc: "这样的密码很容易被猜测"
        })
    }

    return security
}

const scale: Record<'lower' | 'upper' | 'number' | 'special', number> = {
    lower: 1,
    upper: 1,
    number: 0.9,
    special: 0.3
};

export interface PasswordOptions {
    length: number,
    lowercase: boolean,
    uppercase: boolean,
    numbers: boolean,
    special: boolean,
    ignore: string
}

const CHARACTERS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    number: "0123456789",
    special: "@#$%*&~."
}

const removeChars = (raw: string, removeChars: string) => {
    return raw.split("").filter(char => !removeChars.includes(char)).join("")
}

export const generatePassword = ({
    length,
    lowercase,
    uppercase,
    numbers,
    special,
    ignore
}: PasswordOptions) => {
    // Check if any character types are selected
    const hasSelectedTypes = numbers || lowercase || uppercase || special;

    // Check if excluded characters cover all available characters of the selected types
    const excludedNumbers = numbers && '0123456789'.split('').every(char => ignore.includes(char));
    const excludedLowercase = lowercase && 'abcdefghijklmnopqrstuvwxyz'.split('').every(char => ignore.includes(char));
    const excludedUppercase = uppercase && 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').every(char => ignore.includes(char));
    const excludedSpecial = special && '@#$%*&~.'.split('').every(char => ignore.includes(char));

    if (!hasSelectedTypes) {
        return "请至少选择一种字符类型来生成密码"
    }

    if (excludedNumbers || excludedLowercase || excludedUppercase || excludedSpecial) {
        return "所选字符类型已被排除，无法生成密码。请调整设置"
    }


    let password = ""
    const allowedCharacters = {
        lower: lowercase ? removeChars(CHARACTERS.lower, ignore) : "",
        upper: uppercase ? removeChars(CHARACTERS.upper, ignore) : "",
        number: numbers ? removeChars(CHARACTERS.number, ignore) : "",
        special: special ? removeChars(CHARACTERS.special, ignore) : ""
    }

    // Ensure at least one character from each selected type
    if (lowercase) password += allowedCharacters.lower[Math.floor(Math.random() * allowedCharacters.lower.length)];
    if (uppercase) password += allowedCharacters.upper[Math.floor(Math.random() * allowedCharacters.upper.length)];
    if (numbers) password += allowedCharacters.number[Math.floor(Math.random() * allowedCharacters.number.length)];
    if (special) password += allowedCharacters.special[Math.floor(Math.random() * allowedCharacters.special.length)];

    // Adjust length to account for the characters already added
    length -= (lowercase ? 1 : 0) + (uppercase ? 1 : 0) + (numbers ? 1 : 0) + (special ? 1 : 0);

    // Generate remaining characters
    const scaleSum = Object.keys(scale).reduce((sum, key) => sum + (allowedCharacters[key as keyof typeof scale].length > 0 ? scale[key as keyof typeof scale] : 0), 0);
    while (password.length < length) {
        const random = Math.random() * scaleSum;
        if (random < scale.lower) {
            password += allowedCharacters.lower[Math.floor(Math.random() * allowedCharacters.lower.length)];
        } else if (random < scale.upper) {
            password += allowedCharacters.upper[Math.floor(Math.random() * allowedCharacters.upper.length)];
        } else if (random < scale.number) {
            password += allowedCharacters.number[Math.floor(Math.random() * allowedCharacters.number.length)];
        } else if (random < scale.special) {
            password += allowedCharacters.special[Math.floor(Math.random() * allowedCharacters.special.length)];
        }
    }
    return password
}