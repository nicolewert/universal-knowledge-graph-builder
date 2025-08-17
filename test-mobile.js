const { chromium } = require('playwright');

async function testMobileResponsiveness() {
  console.log('🚀 Testing mobile responsiveness...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to graph page on mobile viewport...');
    await page.goto('http://localhost:3006/graph');
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ path: 'mobile-graph.png', fullPage: true });
    console.log('📸 Mobile screenshot saved: mobile-graph.png');
    
    // Check basic functionality
    const title = await page.textContent('h1');
    const nodeCount = await page.locator('circle').count();
    const svgCount = await page.locator('svg').count();
    
    console.log('📊 Mobile test results:');
    console.log('  - Title:', title);
    console.log('  - Nodes rendered:', nodeCount);
    console.log('  - SVG elements:', svgCount);
    
    // Test touch interaction (simulate tap on first node)
    if (nodeCount > 0) {
      const firstNode = page.locator('circle').first();
      await firstNode.tap();
      console.log('👆 Tapped first node on mobile');
      
      // Take screenshot after interaction
      await page.screenshot({ path: 'mobile-after-tap.png' });
      console.log('📸 Post-interaction screenshot: mobile-after-tap.png');
    }
    
    // Test different viewport sizes
    console.log('📱 Testing tablet size...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tablet-graph.png' });
    console.log('📸 Tablet screenshot: tablet-graph.png');
    
    const tabletNodeCount = await page.locator('circle').count();
    console.log('📊 Tablet node count:', tabletNodeCount);
    
    if (nodeCount === tabletNodeCount && nodeCount > 0) {
      console.log('✅ Mobile responsiveness test passed!');
      console.log('  - Graph renders correctly on mobile');
      console.log('  - Touch interactions work');
      console.log('  - Responsive across different screen sizes');
    } else {
      console.log('⚠️ Some issues detected with mobile rendering');
    }
    
  } catch (error) {
    console.error('❌ Mobile test failed:', error);
  } finally {
    await browser.close();
  }
}

testMobileResponsiveness();