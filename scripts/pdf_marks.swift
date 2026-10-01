// PDF 에 Apple Pencil 로 쓴 필기 · 강조(주석) 찾기 — 주차 정리 때 노션 필기와 함께 꼭 확인
// 사용: swift scripts/pdf_marks.swift <파일.pdf> [그림 저장 폴더]
//  → 필기가 있는 쪽 번호를 출력하고, 폴더를 주면 그 쪽들을 필기까지 그린 JPG(p3.jpg …)로 저장 (Read 로 보기)
// iPad 의 PDF 펜 필기는 Stamp / Ink 주석으로 저장됨 (글자 추출로는 안 보임 → 반드시 그림으로 확인)
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count >= 2, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else { print("사용: swift scripts/pdf_marks.swift <파일.pdf> [그림 폴더]"); exit(1) }
let kinds: Set<String> = ["Stamp", "Ink", "Highlight", "Underline", "StrikeOut", "FreeText", "Square", "Circle", "Line", "Text"]
var marked: [Int] = []
for i in 0..<doc.pageCount {
    if let p = doc.page(at: i), p.annotations.contains(where: { kinds.contains($0.type ?? "") }) { marked.append(i + 1) }
}
print(marked.isEmpty ? "필기 없음" : "필기 있는 쪽: " + marked.map(String.init).joined(separator: ", "))
guard args.count >= 3 else { exit(0) }
let out = args[2]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
for n in marked {
    guard let page = doc.page(at: n - 1) else { continue }
    let b = page.bounds(for: .mediaBox)
    let scale: CGFloat = 1400 / max(b.width, b.height)
    let w = Int(b.width * scale), h = Int(b.height * scale)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.current = ctx
    ctx.cgContext.setFillColor(NSColor.white.cgColor)
    ctx.cgContext.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.cgContext.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx.cgContext)          // 주석(펜 필기)까지 그림
    NSGraphicsContext.restoreGraphicsState()
    try? rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])?.write(to: URL(fileURLWithPath: "\(out)/p\(n).jpg"))
}
print("그림 저장: \(out)")
