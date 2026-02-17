export const titleRegex = /^\S(?:.*\S)?$/;
export const pagesRegex = /^(0|[1-9]\d*)$/;
export const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const tagRegex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Advanced (duplicate word)
export const dupWord = /\b(\w+)\s+\1\b/;
