# Mass Spectrum to Audio Converter

This tool converts mass spectrometry data into audio by mapping spectral peaks to sine wave frequencies.

---

## Try It Live

**[mass-spectrum-to-audio-converter.onrender.com](https://mass-spectrum-to-audio-converter.onrender.com)**

---

## About the Project

This project uses migrated data from MassBank hosted on Render, uses spectrometry data (m/z (mass-to-charge) values and intensities), and converts them into sine waves. The project supports three frequency mapping algorithms: linear, inverse, and modulo - with adjustable parameters. Features include a piano keyboard playback interface, displays recently generated as well as most generated compounds from all users, and provides detailed transformation tables showing mass spectrum data and audio transformation data to visualize exactly how the data is being transformed.

**Tech Stack:**

- **Backend**: Python, Flask
- **Frontend**: React, TypeScript, Tailwind CSS (via DaisyUI)
- **Database**: PostgreSQL (using MassBank data from [Release 2025.05.1](https://github.com/MassBank/MassBank-data/releases/tag/2025.05.1))
- **Deployment**: Docker, hosted on Render

---

## Running Locally

### Prerequisites

- **Docker** installed and running

### Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/NicolasMurphy/mass-spectrum-to-audio-converter.git
   cd mass-spectrum-to-audio-converter
   ```

2. **Download the database file:**

   Download `mass_spectrum_db.sql` (465MB) and place it in the `db/` folder:

   **Option A - Direct download:**

   ```bash
   curl -L -o db/mass_spectrum_db.sql https://github.com/NicolasMurphy/mass-spectrum-to-audio-converter/releases/download/2025-08-19/mass_spectrum_db.sql
   ```

   **Option B - Manual download:**
   Visit the [release page](https://github.com/NicolasMurphy/mass-spectrum-to-audio-converter/releases/tag/2025-08-19), download `mass_spectrum_db.sql`, and place it in the `db/` folder.

3. **Create environment file:**

   ```bash
   cp .env.example .env

   ```

4. **Start the application:**

   ```bash
   docker-compose up
   ```

   **Note:** The first startup can take 15+ minutes as it imports the 465MB database file.

5. **Access the application:**

   Open your browser and go to: **http://localhost:5173**

---

## Additional Resources

- **API Documentation**: [mass-spectrum-to-audio-converter.onrender.com/docs.html](https://mass-spectrum-to-audio-converter.onrender.com/docs.html)
- **Blog Post**: [Learn more about the motivation and creative inspiration](https://www.nicolasmurphy.com/blog/mass-spectrometry-music)
