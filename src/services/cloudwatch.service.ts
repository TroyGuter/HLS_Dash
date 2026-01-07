export interface MetricData {
  timestamp: Date;
  value: number;
}

export interface StreamMetrics {
  channelName: string;
  egressBytes: MetricData[];
  requestCount: MetricData[];
  responseTime: MetricData[];
  errorRate: number;
}

class CloudWatchService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getChannelMetrics(
    channelName: string,
    timeRangeMinutes: number = 60
  ): Promise<StreamMetrics> {
    try {
      const response = await fetch(`${this.apiUrl}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          channelName,
          timeRangeMinutes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert timestamp strings back to Date objects
      return {
        ...data,
        egressBytes: data.egressBytes.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        })),
        requestCount: data.requestCount.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        })),
        responseTime: data.responseTime.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  calculateBitrate(bytes: number, seconds: number): string {
    const bitsPerSecond = (bytes * 8) / seconds;
    const mbps = bitsPerSecond / 1000000;
    return mbps.toFixed(2) + ' Mbps';
  }
}

export default CloudWatchService;

