const { chromium } = require('playwright');

async function testGraph() {
  console.log('🚀 Starting graph visualization test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📖 Navigating to graph page...');
    await page.goto('http://localhost:3006/graph');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'graph-test.png', fullPage: true });
    console.log('📸 Screenshot saved as graph-test.png');
    
    // Check if the page contains expected elements
    const title = await page.textContent('h1');
    console.log('📋 Page title:', title);
    
    // Check for graph container
    const graphContainer = await page.locator('svg').count();
    console.log('📊 SVG elements found:', graphContainer);
    
    // Check for loading state or data
    const loadingText = await page.locator('text=Loading knowledge graph').count();
    const noDataText = await page.locator('text=No graph data available').count();
    const graphElements = await page.locator('circle').count(); // D3 nodes are circles
    
    console.log('🔄 Loading indicators:', loadingText);
    console.log('❌ No data indicators:', noDataText);
    console.log('⚪ Graph nodes found:', graphElements);
    
    if (graphElements > 0) {
      console.log('✅ Graph visualization rendered successfully!');
      
      // Try clicking on a node
      const firstNode = page.locator('circle').first();
      if (await firstNode.count() > 0) {
        await firstNode.click();
        console.log('🖱️ Clicked on first node');
      }
    } else if (noDataText > 0) {
      console.log('ℹ️ No data available in graph');
    } else if (loadingText > 0) {
      console.log('⏳ Graph still loading...');
    } else {
      console.log('⚠️ Unknown state');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testGraph();