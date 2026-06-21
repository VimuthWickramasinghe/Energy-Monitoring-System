import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ems.keyblocks.org'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/*/dashboard',
                '/*/analytics',
                '/*/settings',
                '/*/devices',
                '/*/building',
                '/*/demo',
                '/*/demo2',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
