
export interface MetricData {
  timestamp: Date;
  value: number;
}

export interface MediaPackageMetrics {
  egressBytes: MetricData[];
  requestCount: MetricData[];
  responseTime: MetricData[];
  errorRate: number;
}

export interface MediaLivePipelineMetrics {
  inputVideoFrameRate: MetricData[];
  outputVideoFrameRate: MetricData[];
  networkOut?: MetricData[];
  droppedFrames?: MetricData[];
  activeOutputs?: MetricData[];
}

export interface MediaLiveMetrics {
  pipeline0: MediaLivePipelineMetrics;
  pipeline1: MediaLivePipelineMetrics;
}

export interface StreamMetrics {
  channelName: string;
  mediaLiveChannelId?: string;
  mediaPackage: MediaPackageMetrics;
  mediaLive?: MediaLiveMetrics;
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
  mediaLiveChannelId: string | undefined,
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
        mediaLiveChannelId,
        timeRangeMinutes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data = await response.json();

    // Handle API Gateway response wrapping
    if (data.statusCode && data.body) {
      console.log('Detected API Gateway wrapped response');
      data = JSON.parse(data.body);
    } else if (data.body && typeof data.body === 'string') {
      console.log('Unwrapping string body');
      data = JSON.parse(data.body);
    }

    console.log('Final parsed data:', data);

    // Validate response structure
    if (!data || !data.mediaPackage || !data.mediaPackage.egressBytes) {
      console.error('Invalid response structure:', data);
      throw new Error('Response missing required mediaPackage.egressBytes data');
    }

    // Convert timestamp strings back to Date objects for MediaPackage
    const mediaPackage: MediaPackageMetrics = {
      egressBytes: (data.mediaPackage.egressBytes || []).map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })),
      requestCount: (data.mediaPackage.requestCount || []).map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })),
      responseTime: (data.mediaPackage.responseTime || []).map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })),
      errorRate: data.mediaPackage.errorRate || 0
    };

    // Convert timestamp strings for MediaLive if present
    let mediaLive: MediaLiveMetrics | undefined;
    if (data.mediaLive) {
      mediaLive = {
        pipeline0: {
          inputVideoFrameRate: (data.mediaLive.pipeline0?.inputVideoFrameRate || []).map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })),
          outputVideoFrameRate: (data.mediaLive.pipeline0?.outputVideoFrameRate || []).map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })),
          networkOut: data.mediaLive.pipeline0?.networkOut?.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })),
          droppedFrames: data.mediaLive.pipeline0?.droppedFrames?.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })),
          activeOutputs: data.mediaLive.pipeline0?.activeOutputs?.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          }))
        },
        pipeline1: {
          inputVideoFrameRate: (data.mediaLive.pipeline1?.inputVideoFrameRate || []).map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })),
          outputVideoFrameRate: (data.mediaLive.pipeline1?.outputVideoFrameRate || []).map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          }))
        }
      };
    }

    return {
      channelName: data.channelName,
      mediaLiveChannelId: data.mediaLiveChannelId,
      mediaPackage,
      mediaLive
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

  getLatestValue(datapoints: MetricData[]): number {
    if (datapoints.length === 0) return 0;
    return datapoints[datapoints.length - 1].value;
  }

  calculateAverage(datapoints: MetricData[]): number {
    if (datapoints.length === 0) return 0;
    const sum = datapoints.reduce((acc, dp) => acc + dp.value, 0);
    return sum / datapoints.length;
  }
}

export default CloudWatchService;

