# msign.js - Mobile Responsive Signature Pad

A lightweight, mobile-responsive HTML5 signature pad library with touch support and configurable styling options.

![Version](https://img.shields.io/badge/version-3.7-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- ✨ **Touch-Friendly**: Uses Pointer Events API for smooth touch and mouse interaction
- 📱 **Mobile Responsive**: Full-screen overlay modal for optimal mobile experience  
- 🎨 **Highly Configurable**: Customizable appearance via data attributes
- 🖼️ **HiDPI Support**: Crisp canvas rendering on high-resolution displays
- 🔄 **Auto-Sync**: Automatic preview synchronization with textarea output
- ⚡ **Lightweight**: Single-file library with minimal dependencies

## Quick Start

### Basic Usage

1. Include the script in your HTML:
```html
<script src="./msign.js"></script>
```

2. Create signature container and output textarea:
```html
<div class="msign"></div>
<textarea class="msign_output"></textarea>
```

3. Click the signature container to open the signature pad!

### Full Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Signature Pad Demo</title>
    <script src="./msign.js"></script>
</head>
<body>
    <!-- Basic signature pad -->
    <div class="msign" style="height:100px; width:200px;"></div>
    <textarea class="msign_output"></textarea>

    <!-- Custom configuration example -->
    <div class="msign" 
         data-line-width="5"
         data-placeholder="Sign here"
         data-border-style="dashed"
         data-border-color="#999"
         style="height:100px;width:200px;"></div>
    <textarea class="msign_output"></textarea>
</body>
</html>
```

## Configuration Options

### Data Attributes

All configuration is done via `data-*` attributes on the `.msign` container:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-line-width` | 2 | Pen stroke width (1-10px) |
| `data-placeholder` | "Click to Sign" | Placeholder text when empty |
| `data-placeholder-visible` | true | Show/hide placeholder text |
| `data-border-visible` | true | Show/hide border when empty |
| `data-border-style` | "dashed" | Border style: "dashed" or "solid" |
| `data-border-color` | "#ccc" | Border color (any CSS color) |
| `data-border-width` | 2 | Border width in pixels |

### Programmatic Control

```javascript
// Set global pen width (applies to new instances)
window.msignSetLineWidth(3);

// Get configuration limits
console.log(window.msignConfig);
// Output: { defaultWidth: 2, min: 1, max: 10 }
```

## How It Works

### Architecture

- **Single Instance Modal**: Uses one global modal overlay that reuses for all signature instances
- **Canvas-Based**: HTML5 Canvas for smooth drawing performance
- **Pointer Events**: Unified event handling for touch, mouse, and pen input
- **HiDPI Scaling**: Automatic canvas scaling for crisp rendering on high-DPI displays

### Data Flow

1. User clicks `.msign` container
2. Modal overlay opens with signature canvas
3. User draws signature using pointer events
4. On save, signature is converted to PNG data URL
5. Data URL is stored in the paired `.msign_output` textarea
6. Preview image replaces placeholder in the container

## Browser Support

- ✅ Modern browsers with Pointer Events support
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ❌ Internet Explorer (not supported)

## API Reference

### Events

The signature pad works automatically, but you can monitor changes:

```javascript
// Monitor textarea changes
const textarea = document.querySelector('.msign_output');
textarea.addEventListener('input', function() {
    if (this.value.startsWith('data:image/')) {
        console.log('Signature captured:', this.value.length, 'characters');
    }
});
```

### Methods

```javascript
// Initialize signature pad (automatic on DOMContentLoaded)
// Manual initialization if needed:
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignPads);
} else {
    initSignPads();
}

function initSignPads() {
    // Library automatically initializes all .msign elements
    // Custom initialization logic here
}
```

## Styling

### Container Styling

The signature container can be styled with custom CSS:

```css
.msign {
    border: 2px dashed #ccc;
    background: #f9f9f9;
    border-radius: 8px;
    min-height: 80px;
}

.msign.msign--signed {
    border: none;
    background: transparent;
}
```

### Modal Styling

The modal styles are injected dynamically and can be customized by modifying the `modalStyle` constant in the JavaScript file.

## Examples

### Different Line Widths

```html
<!-- Thin line (1px) -->
<div class="msign" data-line-width="1" style="height:100px; width:200px;"></div>
<textarea class="msign_output"></textarea>

<!-- Medium line (5px) -->
<div class="msign" data-line-width="5" style="height:100px; width:200px;"></div>
<textarea class="msign_output"></textarea>

<!-- Thick line (10px) -->
<div class="msign" data-line-width="10" style="height:100px; width:200px;"></div>
<textarea class="msign_output"></textarea>
```

### Custom Appearance

```html
<!-- No placeholder, solid border -->
<div class="msign"
     data-placeholder-visible="false"
     data-border-style="solid"
     data-border-color="#999"
     data-border-width="1"
     style="height:100px;width:200px;"></div>
<textarea class="msign_output"></textarea>

<!-- Hidden placeholder and border when empty -->
<div class="msign"
     data-placeholder-visible="false"
     data-border-visible="false"
     style="height:100px;width:200px;"></div>
<textarea class="msign_output"></textarea>

<!-- Custom placeholder text -->
<div class="msign"
     data-placeholder="Tap here to sign"
     style="height:100px;width:220px;"></div>
<textarea class="msign_output"></textarea>
```

## Best Practices

### Accessibility

- Provide descriptive placeholder text
- Ensure sufficient color contrast for borders
- Consider keyboard navigation alternatives

### Performance

- Avoid very large signature containers (impacts canvas size)
- Use appropriate line width for your use case
- Monitor textarea changes efficiently

### Mobile Experience

- Use full-screen containers on mobile for better usability
- Test with actual touch devices
- Consider signature size requirements for your use case

## Troubleshooting

### Common Issues

**Signature not saving:**
- Ensure `.msign_output` textarea follows each `.msign` container
- Check browser console for warnings
- Verify canvas support in browser

**Poor mobile experience:**
- Ensure viewport meta tag is set
- Use appropriate container sizes for mobile
- Test on actual devices, not just browser emulation

**Canvas appears blurry:**
- This is normal on high-DPI displays
- The library automatically handles HiDPI scaling
- Canvas size is optimized for the display

## Development

### Project Structure

```
Mobile-Responsive-Signpad-msign-js/
├── index.html          # Usage examples and demo
├── msign.js            # Main library (290 lines)
├── .gitattributes      # Git configuration
└── README.md           # This file
```

### Contributing

1. Test changes on both desktop and mobile
2. Ensure backward compatibility
3. Follow existing code style
4. Update documentation as needed

## License

MIT License - feel free to use in personal and commercial projects.

## Changelog

### v3.7
- Added Pointer Events support
- Implemented HiDPI canvas scaling
- Enhanced mobile responsiveness
- Added per-instance configuration via data attributes
- Improved auto-preview synchronization

---

**Need help?** Check the examples in `index.html` or refer to the API documentation above.