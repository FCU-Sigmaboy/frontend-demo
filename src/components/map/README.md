# Map Components

This folder contains all components related to the Map Search feature.

## Components

### Core Components
- **MapContainer.vue** - Google Maps integration with markers, user location, and search radius
- **MapSidebar.vue** - Filter sidebar (desktop: fixed, mobile: bottom sheet)
- **MapItemInfoCard.vue** - Popup card showing item details when marker is clicked

### Filter Components
- **MapSearchBar.vue** - Keyword search input with debounce
- **MapDistanceSlider.vue** - Adjustable search radius slider (1-50km)
- **MapCategoryFilter.vue** - Main and sub-category filtering
- **MapSortControls.vue** - Sort by distance/price/time with direction toggle

## Usage

### Option 1: Direct Import (Current)
```javascript
import MapContainer from '@/components/map/MapContainer.vue'
import MapSidebar from '@/components/map/MapSidebar.vue'
```

### Option 2: Named Exports (Alternative)
```javascript
import { MapContainer, MapSidebar, MapItemInfoCard } from '@/components/map'
```

## File Structure
```
map/
├── index.js                  # Centralized exports
├── README.md                 # This file
├── MapContainer.vue          # Main map component
├── MapSidebar.vue           # Filter sidebar
├── MapItemInfoCard.vue      # Item detail card
├── MapSearchBar.vue         # Search input
├── MapDistanceSlider.vue    # Distance slider
├── MapCategoryFilter.vue    # Category filters
└── MapSortControls.vue      # Sort controls
```

## Related Files
- **Page**: `src/views/MapSearchPage.vue`
- **APIs**: `src/api/get_userLocationAPI.js`, `src/api/get_searchItemsAPI.js`
- **Utils**: `src/utils/googleMapsLoader.js`
- **Route**: `/map-search`
