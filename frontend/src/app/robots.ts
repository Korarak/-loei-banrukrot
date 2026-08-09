import type { MetadataRoute } from "next";

const siteUrl = "https://banrukrot.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin",
                    "/cart",
                    "/orders",
                    "/profile",
                    "/wishlist",
                    "/auth",
                    "/customer-login",
                    "/customer-register",
                    "/forgot-password",
                    "/reset-password",
                    "/verify-email",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
