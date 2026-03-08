const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Customer = require('../models/Customer');

console.log('🔹 Initializing Passport...');
console.log('🔹 Google Client ID present:', !!process.env.GOOGLE_CLIENT_ID);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google Auth Enabled');
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user already exists with this Google ID
                let customer = await Customer.findOne({ provider: 'google', providerId: profile.id });

                if (customer) {
                    // Update profile picture if missing
                    if (!customer.profilePicture && profile.photos && profile.photos.length > 0) {
                        customer.profilePicture = profile.photos[0].value;
                        await customer.save();
                    }
                    return done(null, customer);
                }

                // 2. Check if user exists with the same email (Account Linking)
                if (profile.emails && profile.emails.length > 0) {
                    const email = profile.emails[0].value;
                    customer = await Customer.findOne({ email });

                    if (customer) {
                        // Link the Google account to the existing verified email account
                        // Warning: In a high-security app, you'd want to verify the email first,
                        // but since Google validates emails, this is generally accepted for MVP.
                        customer.provider = 'google';
                        customer.providerId = profile.id;
                        if (!customer.profilePicture && profile.photos && profile.photos.length > 0) {
                            customer.profilePicture = profile.photos[0].value;
                        }
                        await customer.save();
                        return done(null, customer);
                    }
                }

                // 3. Create a new user
                const newCustomer = new Customer({
                    firstName: profile.name.givenName || 'Unknown',
                    lastName: profile.name.familyName || 'User',
                    email: profile.emails[0].value,
                    provider: 'google',
                    providerId: profile.id,
                    isActive: true,
                    profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined
                    // phone is optional, passwordHash is optional
                });

                await newCustomer.save();
                done(null, newCustomer);

            } catch (err) {
                console.error('Google Auth Error:', err);
                return done(err, null);
            }
        }));
} else {
    console.warn('⚠️ Google Client ID/Secret not found. Google Auth disabled.');
}

module.exports = passport;
