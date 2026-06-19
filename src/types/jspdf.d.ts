declare module 'jspdf' {
  export default class jsPDF {
    constructor(opts?: any)
    setFillColor(...args: any[]): this
    setTextColor(...args: any[]): this
    setFontSize(size: number): this
    setFont(name: string, style?: string): this
    rect(x: number, y: number, w: number, h: number, style?: string): this
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): this
    text(text: string | string[], x: number, y: number, opts?: any): this
    splitTextToSize(text: string, maxWidth: number): string[]
    setPage(page: number): this
    save(filename: string): void
    internal: any
  }
}
declare module 'jspdf-autotable' {
  export default function autoTable(doc: any, opts: any): void
}
