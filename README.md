# SpaceBridge - Perplexity Exporter

SpaceBridge is a premium, offline-first React application designed to manage, clean, organize, and export your Perplexity AI thread data. It offers a beautiful, high-performance UI to bridge the gap between your raw data and your knowledge management systems.

## 🚀 Features

- **Upload & Parse:** Drag and drop Perplexity JSON exports. Automatically parse threads and artifacts.
- **Smart Cleanup & Data Health:** Automatically identify and remove empty or broken drafts. View detailed integrity scores for your data.
- **Bulk Action Toolbar:** Select multiple spaces to categorize, archive, tag, or delete in one click.
- **Smart Export Preview:** View exactly how your Markdown exports will look with a built-in syntax-highlighted code preview.
- **Export Analytics & Data Visualization:** Real-time insights into your SpaceBridge pipeline, visualized with beautiful gradient charts.
- **Performance Profiler:** Built-in system metrics tracking render times, memory heap, and interaction delays.
- **Cloud Sync:** Secure Google Drive integration for cross-device synchronization (OAuth 2.0).
- **Offline-First:** Fully functional without an internet connection using robust local storage caching.
- **Session Security:** Auto-lock and memory clear after 15 minutes of inactivity.

## 📦 Setup & Installation

1. **Prerequisites:** 
   - Node.js (v18+ recommended)
   - npm or yarn

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a \`.env\` file in the root directory if you need to override default API keys for cloud sync (Optional).

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at \`http://localhost:3000\`.

## 🛠️ Build for Production (Web Server)

To compile the application for production deployment on your own web server:

1. Run the build command:
   ```bash
   npm run build
   ```
2. The compiled, optimized files will be generated in the \`dist/\` directory.
3. Upload the contents of the \`dist/\` directory to your web server (e.g., Nginx, Apache, Vercel, Netlify).

## 📊 Data Visualization & Profiler

SpaceBridge Pro includes an advanced **System Profiler** tab:
- **Memory Tracking:** Real-time visualization of JS Heap Size (on supported browsers).
- **Performance Metrics:** Tracks app load time, component render delays, and DOM interaction speeds.
- **Export Data Viz:** Historical charts showing threads and artifacts processed over time.

## 📄 License

MIT License. See LICENSE for more details.
