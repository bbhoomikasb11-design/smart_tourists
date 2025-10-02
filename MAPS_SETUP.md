# 🗺️ Google Maps Setup Instructions

## Quick Setup for Interactive Maps

### Step 1: Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Drawing Library** (for geo-fencing tools)

### Step 2: Configure API Key
1. Go to "Credentials" in your Google Cloud Console
2. Create a new API Key
3. Set up restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add `http://localhost:3000/*` and your domain

### Step 3: Update the Map File
1. Open `geofence.html`
2. Find line 170: `script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap&libraries=drawing,geometry';`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

### Step 4: Test the Map
1. Start your server: `npm start`
2. Navigate to `http://localhost:3000/geofence.html`
3. The map should load with interactive features

## Features Available

### ✅ With Valid API Key:
- Interactive Google Maps
- Geo-fencing tools (circles & polygons)
- Real-time location tracking
- Tourist safety zones
- Drawing tools for restricted areas

### 🎮 Demo Mode (No API Key):
- Static information display
- Tourist location highlights
- Safety zone information
- Educational content about North-East India

## Troubleshooting

### Common Issues:
1. **"RefererNotAllowedMapError"**: Add your domain to API key restrictions
2. **"ApiNotActivatedMapError"**: Enable Maps JavaScript API
3. **"InvalidKeyMapError"**: Check your API key is correct
4. **"BillingNotEnabled"**: Set up billing account in Google Cloud

### Error Messages:
- The map will show helpful error messages if something goes wrong
- Check browser console for detailed error logs
- Use demo mode if you can't set up API key immediately

## Cost Information
- Google Maps API has free tier limits
- For development/testing: Usually free
- For production: Check Google's pricing

---

**Need Help?** The map includes built-in error handling and demo mode for testing without an API key!

