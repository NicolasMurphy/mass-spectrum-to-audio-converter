# Mass Spectrum to Audio Converter API Documentation

## Overview

The Mass Spectrum to Audio Converter API converts mass spectrometry data into audio files using configurable algorithms and parameters. The API retrieves compound spectra from the `mass_spectrum_db` database hosted on Render (migrated from MassBank database from [Release 2025.05.1](https://github.com/MassBank/MassBank-data/releases/tag/2025.05.1)) or accepts custom spectrum data, and generates audio data along with detailed spectrum transformation information.

## Base URL

```
https://mass-spectrum-to-audio-converter.onrender.com
```

---

## Endpoints

### 1. Generate Audio and Spectrum Data from Compound

**Endpoint:** `POST /massbank/<algorithm>`

Generates audio data from a compound's mass spectrum data using the specified algorithm and returns both the audio file as base64 and detailed spectrum transformation data.

#### Path Parameters

| Parameter   | Type   | Required | Description                                                                     |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------- |
| `algorithm` | string | Yes      | Algorithm for audio generation. Must be either `linear`, `inverse`, or `modulo` |

#### Request Body

**Content-Type:** `application/json`

| Parameter     | Type    | Required | Default | Validation                    | Description                                                        |
| ------------- | ------- | -------- | ------- | ----------------------------- | ------------------------------------------------------------------ |
| `compound`    | string  | Yes      | -       | Non-empty, max 349 characters | Name of the compound to search for                                 |
| `offset`      | float   | No       | 300     | -1,000,000 to 1,000,000       | `Hz = m/z + offset` _(linear algorithm only)_                      |
| `scale`       | float   | No       | 100000  | -1,000,000 to 1,000,000       | `Hz = scale / (m/z + shift)` _(inverse algorithm only)_            |
| `shift`       | float   | No       | 1       | -1,000,000 to 1,000,000       | `Hz = scale / (m/z + shift)` _(inverse algorithm only)_            |
| `factor`      | float   | No       | 10      | -1,000,000 to 1,000,000       | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `modulus`     | float   | No       | 500     | -1,000,000 to 1,000,000       | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `base`        | float   | No       | 100     | -1,000,000 to 1,000,000       | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `sample_rate` | integer | No       | 44100   | 3500 to 192000                | Audio sample rate in Hz                                            |
| `duration`    | float   | No       | 5       | 0.01 to 30.0                  | Duration of generated audio in seconds                             |

**Note:** "Required" means the parameter must be provided in the request. Optional parameters will use their default values if not specified.

#### Response

**Success Response (200 OK)**

**Content-Type:** `application/json`

**Example Response:**

```json
{
  "accession": "MSBNK-ACES_SU-AS000088",
  "algorithm": "linear",
  "audio_base64": "UklGRiSmDgBXQVZFZm10IBAAAAABAAEA...",
  "audio_settings": {
    "duration": 5.0,
    "sample_rate": 44100
  },
  "compound": "Caffeine",
  "parameters": {
    "offset": 300.0
  },
  "spectrum": [
    {
      "amplitude_db": -39.67184178472352,
      "amplitude_linear": 0.010385033713897209,
      "frequency": 356.0498390197754,
      "intensity": 5501836,
      "mz": 56.04983901977539
    },
    {
      "amplitude_db": -27.48478053530794,
      "amplitude_linear": 0.042243605014416714,
      "frequency": 369.04469299316406,
      "intensity": 22380032,
      "mz": 69.04469299316406
    },
    {
      "amplitude_db": -25.765718624084222,
      "amplitude_linear": 0.051488953951078366,
      "frequency": 383.06038665771484,
      "intensity": 27278080,
      "mz": 83.06038665771484
    }
  ]
}
```

**Response Fields:**

| Field                         | Type    | Description                                  |
| ----------------------------- | ------- | -------------------------------------------- |
| `compound`                    | string  | Actual compound name found in database       |
| `accession`                   | string  | MassBank accession number                    |
| `audio_base64`                | string  | Base64-encoded WAV audio file                |
| `spectrum`                    | array   | Array of spectrum transformation data points |
| `spectrum[].mz`               | float   | Original m/z value from database             |
| `spectrum[].frequency`        | float   | Converted frequency in Hz                    |
| `spectrum[].intensity`        | float   | Original intensity value from database       |
| `spectrum[].amplitude_linear` | float   | Normalized amplitude (0-1 range)             |
| `spectrum[].amplitude_db`     | float   | Amplitude in decibels                        |
| `algorithm`                   | string  | Algorithm used for conversion                |
| `parameters`                  | object  | Algorithm-specific parameters used           |
| `parameters.offset`           | float   | Offset value (linear algorithm only)         |
| `parameters.scale`            | float   | Scale value (inverse algorithm only)         |
| `parameters.shift`            | float   | Shift value (inverse algorithm only)         |
| `parameters.factor`           | float   | Factor value (modulo algorithm only)         |
| `parameters.modulus`          | float   | Modulus value (modulo algorithm only)        |
| `parameters.base`             | float   | Base value (modulo algorithm only)           |
| `audio_settings`              | object  | Audio generation settings                    |
| `audio_settings.duration`     | float   | Duration of generated audio in seconds       |
| `audio_settings.sample_rate`  | integer | Audio sample rate in Hz                      |

**Error Responses**

| Status Code | Description                | Example Response                                                                          |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| 400         | Invalid algorithm          | `{"error": "Unsupported algorithm: 'fourier'. Must be 'linear', 'inverse', or 'modulo'"}` |
| 400         | Missing compound           | `{"error": "No compound provided"}`                                                       |
| 400         | Compound too long          | `{"error": "Compound name is too long. Maximum length is 349 characters."}`               |
| 400         | Invalid parameter type     | `{"error": "Invalid offset. Must be a float."}`                                           |
| 400         | Parameter out of range     | `{"error": "offset must be between -1,000,000 and 1,000,000."}`                           |
| 400         | Invalid duration           | `{"error": "Duration must be between 0.01 and 30 seconds."}`                              |
| 400         | Invalid sample rate        | `{"error": "Sample rate must be between 3500 and 192000."}`                               |
| 400         | Invalid sample rate format | `{"error": "Invalid sample rate. Must be an integer."}`                                   |
| 400         | Invalid JSON               | `{"error": "No JSON data provided"}`                                                      |
| 404         | Compound not found         | `{"error": "No records found"}`                                                           |
| 429         | Rate limit exceeded        | `{"error": "Too many requests"}`                                                          |
| 500         | Internal server error      | `{"error": "Internal server error"}`                                                      |

#### Example Requests

**Basic Request (Linear Algorithm)**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/massbank/linear
```

```json
{
  "compound": "caffeine"
}
```

**Linear Algorithm with Custom Parameters**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/massbank/linear
```

```json
{
  "compound": "aspirin",
  "offset": 250,
  "duration": 10,
  "sample_rate": 48000
}
```

**Inverse Algorithm with Custom Parameters**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/massbank/inverse
```

```json
{
  "compound": "folate",
  "scale": 50000,
  "shift": 2,
  "duration": 3
}
```

**Modulo Algorithm with Custom Parameters**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/massbank/modulo
```

```json
{
  "compound": "glucose",
  "factor": 15,
  "modulus": 600,
  "base": 150,
  "duration": 7,
  "sample_rate": 44100
}
```

---

### 2. Generate Audio and Spectrum Data from Custom Spectrum

**Endpoint:** `POST /custom/<algorithm>`

Generates audio data from custom mass spectrum data using the specified algorithm and returns both the audio file as base64 and detailed spectrum transformation data.

#### Path Parameters

| Parameter   | Type   | Required | Description                                                                     |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------- |
| `algorithm` | string | Yes      | Algorithm for audio generation. Must be either `linear`, `inverse`, or `modulo` |

#### Request Body

**Content-Type:** `application/json`

| Parameter       | Type    | Required | Default | Validation              | Description                                                        |
| --------------- | ------- | -------- | ------- | ----------------------- | ------------------------------------------------------------------ |
| `spectrum_text` | string  | Yes      | -       | 3 to 100,000 characters | Mass spectrum data as m/z intensity pairs (whitespace-separated)   |
| `offset`        | float   | No       | 300     | -1,000,000 to 1,000,000 | `Hz = m/z + offset` _(linear algorithm only)_                      |
| `scale`         | float   | No       | 100000  | -1,000,000 to 1,000,000 | `Hz = scale / (m/z + shift)` _(inverse algorithm only)_            |
| `shift`         | float   | No       | 1       | -1,000,000 to 1,000,000 | `Hz = scale / (m/z + shift)` _(inverse algorithm only)_            |
| `factor`        | float   | No       | 10      | -1,000,000 to 1,000,000 | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `modulus`       | float   | No       | 500     | -1,000,000 to 1,000,000 | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `base`          | float   | No       | 100     | -1,000,000 to 1,000,000 | `Hz = ((m/z * factor) % modulus) + base` _(modulo algorithm only)_ |
| `sample_rate`   | integer | No       | 44100   | 3500 to 192000          | Audio sample rate in Hz                                            |
| `duration`      | float   | No       | 5       | 0.01 to 30.0            | Duration of generated audio in seconds                             |

**Note:** "Required" means the parameter must be provided in the request. Optional parameters will use their default values if not specified.

#### Response

**Success Response (200 OK)**

**Content-Type:** `application/json`

**Example Response:**

```json
{
  "accession": "CUSTOM-001",
  "algorithm": "linear",
  "audio_base64": "UklGRsy6BgBXQVZFZm10IBAAAAABAAEA...",
  "audio_settings": {
    "duration": 5.0,
    "sample_rate": 44100
  },
  "compound": "Custom Compound",
  "parameters": {
    "offset": 300.0
  },
  "spectrum": [
    {
      "amplitude_db": 0.0,
      "amplitude_linear": 1.0,
      "frequency": 373.04018778,
      "intensity": 16.07433749,
      "mz": 73.04018778
    },
    {
      "amplitude_db": -17.917601867484784,
      "amplitude_linear": 0.1270924953063182,
      "frequency": 375.05583784,
      "intensity": 2.042927662,
      "mz": 75.05583784
    }
  ]
}
```

**Response Fields:**

| Field                         | Type    | Description                                     |
| ----------------------------- | ------- | ----------------------------------------------- |
| `compound`                    | string  | Name of the custom compound ("Custom Compound") |
| `accession`                   | string  | Custom accession identifier ("CUSTOM-001")      |
| `audio_base64`                | string  | Base64-encoded WAV audio file                   |
| `spectrum`                    | array   | Array of spectrum transformation data points    |
| `spectrum[].mz`               | float   | Original m/z value from custom input            |
| `spectrum[].frequency`        | float   | Converted frequency in Hz                       |
| `spectrum[].intensity`        | float   | Original intensity value from custom input      |
| `spectrum[].amplitude_linear` | float   | Normalized amplitude (0-1 range)                |
| `spectrum[].amplitude_db`     | float   | Amplitude in decibels                           |
| `algorithm`                   | string  | Algorithm used for conversion                   |
| `parameters`                  | object  | Algorithm-specific parameters used              |
| `parameters.offset`           | float   | Offset value (linear algorithm only)            |
| `parameters.scale`            | float   | Scale value (inverse algorithm only)            |
| `parameters.shift`            | float   | Shift value (inverse algorithm only)            |
| `parameters.factor`           | float   | Factor value (modulo algorithm only)            |
| `parameters.modulus`          | float   | Modulus value (modulo algorithm only)           |
| `parameters.base`             | float   | Base value (modulo algorithm only)              |
| `audio_settings`              | object  | Audio generation settings                       |
| `audio_settings.duration`     | float   | Duration of generated audio in seconds          |
| `audio_settings.sample_rate`  | integer | Audio sample rate in Hz                         |

**Error Responses**

| Status Code | Description                  | Example Response                                                                                                      |
| ----------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 400         | Invalid algorithm            | `{"error": "Unsupported algorithm: 'fourier'. Must be 'linear', 'inverse', or 'modulo'"}`                             |
| 400         | Missing spectrum text        | `{"error": "spectrum_text is required"}`                                                                              |
| 400         | Spectrum text invalid length | `{"error": "Spectrum data must be between 3 and 100,000 characters."}`                                                |
| 400         | Invalid spectrum format      | `{"error": "Invalid spectrum data format: Spectrum data must have an even number of values (pairs of mz/intensity)"}` |
| 400         | Invalid parameter type       | `{"error": "Invalid offset. Must be a float."}`                                                                       |
| 400         | Parameter out of range       | `{"error": "offset must be between -1,000,000 and 1,000,000."}`                                                       |
| 400         | Invalid duration             | `{"error": "Duration must be between 0.01 and 30 seconds."}`                                                          |
| 400         | Invalid sample rate          | `{"error": "Sample rate must be between 3500 and 192000."}`                                                           |
| 400         | Invalid sample rate format   | `{"error": "Invalid sample rate. Must be an integer."}`                                                               |
| 400         | Invalid JSON                 | `{"error": "No JSON data provided"}`                                                                                  |
| 429         | Rate limit exceeded          | `{"error": "Too many requests"}`                                                                                      |
| 500         | Internal server error        | `{"error": "Internal server error"}`                                                                                  |

#### Example Requests

**Basic Request (Linear Algorithm)**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/custom/linear
```

```json
{
  "spectrum_text": "73.04018778 16.07433749\n75.05583784 2.042927662"
}
```

**Linear Algorithm with Custom Parameters**

```
POST https://mass-spectrum-to-audio-converter.onrender.com/custom/linear
```

```json
{
  "spectrum_text": "73.04018778 16.07433749\n75.05583784 2.042927662\n84.08132432 1.258207367",
  "offset": 250,
  "duration": 10,
  "sample_rate": 48000
}
```

---

### 3. Get Recently Generated Compounds

**Endpoint:** `GET /history`

Retrieves recently generated compounds.

#### Query Parameters

| Parameter | Type    | Required | Default | Description                                            |
| --------- | ------- | -------- | ------- | ------------------------------------------------------ |
| `limit`   | integer | No       | 20      | Maximum number of recently generated entries to return |

#### Response

**Success Response (200 OK)**

```json
{
  "history": [
    {
      "accession": "MSBNK-Antwerp_Univ-METOX_P100302_F638",
      "compound": "Folate",
      "created_at": "2025-07-09T03:45:51.639366+00:00"
    },
    {
      "accession": "MSBNK-ACES_SU-AS000088",
      "compound": "Caffeine",
      "created_at": "2025-07-09T03:45:44.172214+00:00"
    },
    {
      "accession": "MSBNK-ACES_SU-AS000078",
      "compound": "Aspirin",
      "created_at": "2025-07-09T03:45:33.844220+00:00"
    }
  ]
}
```

**Error Responses**

| Status Code | Description                                                    | Example Response                 |
| ----------- | -------------------------------------------------------------- | -------------------------------- |
| 429         | Rate limit exceeded (shared across `/history` and `/popular`) | `{"error": "Too many requests"}` |
| 500         | Internal server error                                          | `{"error": "Internal server error"}` |

#### Example Requests

**Get Last 20 Generations**

```
GET https://mass-spectrum-to-audio-converter.onrender.com/history
```

**Get Last 50 Generations**

```
GET https://mass-spectrum-to-audio-converter.onrender.com/history?limit=50
```

### 4. Get Most Generated Compounds

**Endpoint:** `GET /popular`

Retrieves the most frequently generated compounds based on recent generations.

#### Query Parameters

| Parameter | Type    | Required | Default | Description                                        |
| --------- | ------- | -------- | ------- | -------------------------------------------------- |
| `limit`   | integer | No       | 20      | Maximum number of most generated entries to return |

#### Response

**Success Response (200 OK)**

```json
{
  "popular": [
    {
      "compound": "Caffeine",
      "search_count": 147
    },
    {
      "compound": "Mellein",
      "search_count": 33
    },
    {
      "compound": "Methyltestosterone",
      "search_count": 31
    },
    {
      "compound": "BIOTIN",
      "search_count": 26
    },
    {
      "compound": "Choline",
      "search_count": 25
    }
  ]
}
```

**Error Responses**

| Status Code | Description                                                    | Example Response                     |
| ----------- | -------------------------------------------------------------- | ------------------------------------ |
| 429         | Rate limit exceeded (shared across `/history` and `/popular`) | `{"error": "Too many requests"}`     |
| 500         | Internal server error                                          | `{"error": "Internal server error"}` |

#### Example Requests

**Get Top 20 Most Generated Compounds**

```
GET https://mass-spectrum-to-audio-converter.onrender.com/popular
```

**Get Top 10 Most Generated Compounds**

```
GET https://mass-spectrum-to-audio-converter.onrender.com/popular?limit=10
```
