/** QR encoder is loaded on demand (keeps it out of the guest page's initial JS). */
export const loadQr = () => import("./qr").then((m) => m.qrSvg);
