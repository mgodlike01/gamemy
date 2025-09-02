// ������������� ������� ��� ������������

// �������� (�������/����)
export async function preloadImages(
    urls: string[],
    onProgress?: (done: number, total: number) => void
) {
    let done = 0;
    const total = urls.length;

    await Promise.all(
        urls.map(
            (src) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        done++;
                        onProgress?.(done, total);
                        resolve();
                    };
                    img.src = src;
                })
        )
    );
}

// ������ (@font-face) � ���, ���� ����������
export async function waitForFonts() {
    if ("fonts" in document) {
        // @ts-ignore
        await (document as any).fonts.ready;
    }
}

// ������������ ����� (link rel="stylesheet")
export async function waitForStylesheet(selector = 'link[rel="stylesheet"]') {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>(selector));
    await Promise.all(
        links.map(
            (l) =>
                new Promise<void>((resolve) => {
                    if (l.sheet) return resolve();
                    l.addEventListener("load", () => resolve(), { once: true });
                    l.addEventListener("error", () => resolve(), { once: true }); // �� ��������� ��������
                })
        )
    );
}
