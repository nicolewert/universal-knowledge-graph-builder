const { chromium } = require('playwright');

async function testRealtimeUpdates() {
  console.log('🚀 Testing real-time updates...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📖 Navigating to graph page...');
    await page.goto('http://localhost:3006/graph');
    await page.waitForLoadState('networkidle');
    
    // Count initial nodes
    let nodeCount = await page.locator('circle').count();
    console.log('⚪ Initial node count:', nodeCount);
    
    console.log('⏳ Waiting 5 seconds before adding new data...');
    await page.waitForTimeout(5000);
    
    // Take screenshot before adding data
    await page.screenshot({ path: 'before-realtime-update.png' });
    console.log('📸 Screenshot saved: before-realtime-update.png');
    
    console.log('🎯 Now run: node add-more-test-data.js in another terminal');
    console.log('👁️ Watching for real-time updates...');
    
    // Monitor for changes over 60 seconds
    const startTime = Date.now();
    const monitorDuration = 60000; // 60 seconds
    let lastNodeCount = nodeCount;
    let updateCount = 0;
    
    while (Date.now() - startTime < monitorDuration) {
      const currentNodeCount = await page.locator('circle').count();
      
      if (currentNodeCount !== lastNodeCount) {
        updateCount++;
        console.log(`🔄 Update ${updateCount}: Node count changed from ${lastNodeCount} to ${currentNodeCount}`);
        lastNodeCount = currentNodeCount;
        
        // Take screenshot of update
        await page.screenshot({ path: `update-${updateCount}.png` });
        console.log(`📸 Screenshot saved: update-${updateCount}.png`);
      }
      
      // Check every 2 seconds
      await page.waitForTimeout(2000);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-realtime-state.png' });
    console.log('📸 Final screenshot saved: final-realtime-state.png');
    
    const finalNodeCount = await page.locator('circle').count();
    console.log('📊 Final results:');
    console.log('  - Initial nodes:', nodeCount);
    console.log('  - Final nodes:', finalNodeCount);
    console.log('  - Total updates detected:', updateCount);
    
    if (updateCount > 0) {
      console.log('✅ Real-time updates working correctly!');
    } else {
      console.log('ℹ️ No real-time updates detected during monitoring period');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🎯 Test complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testRealtimeUpdates();