import { getCompletePSNData, displayPSNData } from './index';
import { scrapePSNDashboard, displayScrapedData } from './scraper';

export async function runPSNDemo(npsso: string, useAPI: boolean = true): Promise<void> {
  console.clear();
  console.log('🎮 PlayStation Data Collector');
  console.log('===============================\n');
  
  if (useAPI) {
    console.log('🔧 Mode: PlayStation API (Real Data)\n');
    
    try {
      const psnData = await getCompletePSNData(npsso);
      displayPSNData(psnData);
      
      if (!psnData.success) {
        console.log('\n⚠️  API failed, falling back to scraping...\n');
        const scraped = await scrapePSNDashboard(npsso);
        displayScrapedData(scraped);
      }
      
    } catch (error) {
      console.error('❌ API collection failed:', error);
      console.log('\n🔄 Falling back to web scraping...\n');
      
      const scraped = await scrapePSNDashboard(npsso);
      displayScrapedData(scraped);
    }
    
  } else {
    console.log('🕷️  Mode: Web Scraping (Fallback)\n');
    
    const scraped = await scrapePSNDashboard(npsso);
    displayScrapedData(scraped);
  }
}

// Export for direct usage
export { getCompletePSNData, displayPSNData, scrapePSNDashboard, displayScrapedData };