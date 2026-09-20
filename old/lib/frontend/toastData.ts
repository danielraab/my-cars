import { Variants } from "./bootstrap.t"

const TOAST_DEFAULT_DELAY = 3000

export class ToastData {
    title: string
    message: string
    variant: Variants
    autohide: boolean
    closingDelayMs: number
    date: Date
    show: boolean

    constructor(title: string, message:string, variant: Variants = 'light', autohide = false,closingDelayMs = TOAST_DEFAULT_DELAY, date = new Date()) {
        this.title = title
        this.message = message
        this.closingDelayMs = closingDelayMs
        this.variant = variant
        this.autohide = autohide
        this.date = date
        this.show = true
    }
};
