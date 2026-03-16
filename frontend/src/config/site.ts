export const siteConfig = {
    brand: {
        name: "บ้านรักรถ",
        englishName: "BANRUKROT",
        tagline: "Vespa Specialist & Oat Engineering",
        description: "ยกระดับการขับขี่ของคุณด้วยอะไหล่เวสป้าคุณภาพเยี่ยม คัดสรรเพื่อคนรักรถตัวจริง พร้อมบริการดูแลซ่อมบำรุงและงานโรงกลึงครบวงจร โดยช่างโอ๊ต (Oat Engineering)",
    },
    owner: "นายกิตติธัช กุลัตถ์นาม",
    footerData: {
        explore: [
            { label: "รายการสินค้า", href: "/products" },
            { label: "ตะกร้าสินค้า", href: "/cart" },
            { label: "ประวัติการสั่งซื้อ", href: "/orders" },
        ],
        contact: {
            header: "ติดต่อเรา",
            items: [
                { type: "phone", label: "ช่างโอ๊ต", value: "061-370-2484" },
                { type: "phone", label: "ร้าน", value: "094-373-0664" },
                { type: "address", value: "519/2 หมู่ 5 บ้านหนองผักก้าม ต.เมือง อ.เมือง จ.เลย 42000" },
                { type: "maps", value: "พิกัดร้าน", href: "https://goo.gl/maps/Cbas3yCjPz6feeSPA" }
            ],
            social: {
                facebook: "https://www.facebook.com/profile.php?id=100063556782744",
                tiktok: "https://www.tiktok.com/@oatengineering",
                youtube: "https://www.youtube.com/@kittithat168",
                instagram: "https://instagram.com/banrakrod", // Keep as placeholder or remove if not needed
                line: "https://line.me/ti/p/banrakrod"
            }
        },
        legal: [
            { label: "นโยบายความเป็นส่วนตัว", href: "#" },
            { label: "เงื่อนไขการให้บริการ", href: "#" },
        ],
        copyright: `© ${new Date().getFullYear()} บ้านรักรถ & OAT Engineering. สงวนลิขสิทธิ์.`
    }
};
