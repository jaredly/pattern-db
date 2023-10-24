//

export function getTagMap(
    data: FormData,
    tags: { id: string; category: string; name: string }[],
    map: {
        [key: string]: {
            id: string;
            notes: string | null;
            images: {
                id: string;
                location: string | null;
                source: string | null;
                date: string | null;
                url: string;
            }[];
            links: { id: string; kind: string; url: string }[];
            tags: { id: string; category: string; name: string }[];
        };
    }
) {
    const selected = data.getAll("pattern") as string[];
    const tmap: { [key: string]: boolean } = {};
    if (selected.length) {
        tags.forEach(({ id }) => {
            let got = 0;
            let not = 0;
            selected.forEach((pid) => {
                const found = map[pid].tags.find((t) => t.id === id);
                if (found) {
                    got++;
                } else {
                    not++;
                }
            });
            if (got === selected.length) {
                tmap[id] = true;
            } else if (not !== selected.length) {
                tmap[id] = false;
            }
        });
    }
    return tmap;
}
