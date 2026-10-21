import { ValueConverter } from "@microsoft/fast-element"

export const integerConverter: ValueConverter = {
    toView(value: number): string {
        return value.toString()
    },

    fromView(value: string): number {
        return parseInt(value)
    },
}

export const floatConverter: ValueConverter = {
    toView(value: number): string {
        return value.toString()
    },

    fromView(value: string): number {
        return parseFloat(value)
    },
}

export const ourBooleanConverter: ValueConverter = {
    toView(value: number): string {
        return value.toString()
    },

    fromView(value: boolean | string): boolean {
        return value === true || value === "true";
    },
}
