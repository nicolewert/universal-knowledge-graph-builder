# URL Content Scraping Feature

## Overview

The URL Content Scraping feature allows users to extract and store web page content directly into the Universal Knowledge Graph Builder. This powerful tool enables rapid information gathering from online sources, transforming web content into structured, searchable documents.

## Key Features

- **Web Content Extraction**: Scrape text content from any HTTP/HTTPS webpage
- **Real-time Processing**: Track scraping progress with intuitive UI feedback
- **Robust Error Handling**: Comprehensive error management for various scraping scenarios
- **Content Sanitization**: Clean and normalize extracted web content
- **Convex Integration**: Seamless storage of scraped documents in real-time database

## Technical Implementation

### Scraping Process

1. **URL Validation**
   - Strict validation of HTTP/HTTPS URLs
   - Prevents invalid or potentially malicious URL inputs

2. **Content Extraction**
   - Uses native `fetch()` API for reliable web scraping
   - 30-second timeout to prevent long-running requests
   - Removes HTML tags, scripts, and unnecessary markup
   - Decodes HTML entities for clean text representation

3. **Content Processing**
   - Extracts page title from HTML
   - Removes excess whitespace and normalizes text
   - Truncates content to 50KB maximum length
   - Preserves meaningful text content

### Progress Tracking

- Real-time progress simulation (0-100%)
- Granular status updates during scraping
- Error states with descriptive messages

## Usage Guide

### Frontend Hook: `useUrlScraping()`

```typescript
const { 
  url,        // Current URL being scraped
  progress,   // Scraping progress (0-100)
  error,      // Error message (if any)
  documentId, // Generated document ID
  scrapeUrl,  // Function to start scraping
  resetScraping // Reset scraping state
} = useUrlScraping();

// Example usage
const handleScrape = () => {
  scrapeUrl('https://example.com/article');
};
```

### Convex Action: `scrapeUrl`

Directly callable Convex action for URL scraping:

```typescript
const result = await scrapeUrl({ url: 'https://example.com' });
// Returns: { 
//   success: boolean, 
//   title: string, 
//   content: string, 
//   documentId?: string 
// }
```

## Limitations and Constraints

- **Content Size**: Maximum 50KB per scraped document
- **Timeout**: 30-second request timeout
- **Supported Protocols**: HTTP and HTTPS only
- **Content Types**: Primarily text-based web pages
- **Restrictions**:
  - Cannot scrape dynamic content requiring JavaScript
  - Limited support for complex web applications
  - Respects robots.txt and website scraping policies

## Error Handling

Potential Error Scenarios:
- Invalid URL format
- Network connectivity issues
- Request timeout (30 seconds)
- Insufficient content extraction
- Unsupported or restricted websites

Example Error Handling:
```typescript
if (!result.success) {
  console.error(result.error); 
  // Handle specific error scenarios
}
```

## Performance Considerations

- Lightweight extraction mechanism
- Minimal performance overhead
- Asynchronous processing
- Real-time document creation in Convex

## Security Precautions

- URL format validation
- User-Agent spoofing for improved compatibility
- Timeout mechanism to prevent indefinite requests
- Content sanitization to remove potentially harmful scripts

## Future Improvements

- Support for more complex web page structures
- Enhanced content parsing for specific sites
- Improved error handling and reporting
- Potential integration with web archiving services

## Troubleshooting

### Common Issues

1. **Blank or Truncated Content**
   - Ensure the target URL contains readable text
   - Check website accessibility
   - Verify network connectivity

2. **Timeout Errors**
   - Slow-loading websites may trigger timeout
   - Check website responsiveness
   - Consider manual content extraction for complex sites

3. **Permission Denied**
   - Some websites block automated scraping
   - Respect website terms of service
   - Use alternative information sources

## Hackathon Pro Tips

- Use for rapid research and information gathering
- Combine with Knowledge Graph Builder for advanced document processing
- Ideal for creating quick reference materials
- Perfect for aggregating information from multiple sources

## Example Use Cases

- Academic research compilation
- Competitive intelligence gathering
- News and article summarization
- Technical documentation extraction
- Research paper and blog content aggregation

## License

Part of the Universal Knowledge Graph Builder project. 
MIT License - Use freely in your hackathon projects!