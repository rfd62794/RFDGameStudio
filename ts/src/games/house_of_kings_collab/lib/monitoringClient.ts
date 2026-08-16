import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

export interface QuotaUsageData {
  readsToday: number;
  writesToday: number;
  deletesToday: number;
  storageBytes: number;
  storageGiB: number;
  timestamp: string;
}

export async function getFirestoreUsage(projectId: string): Promise<QuotaUsageData> {
  const name = client.projectPath(projectId);

  const nowSec = Math.floor(Date.now() / 1000);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const startOfDaySec = Math.floor(startOfDay.getTime() / 1000);

  const queryMetric = async (type: string, isGauge: boolean = false): Promise<number> => {
    try {
      const startTimeSec = isGauge ? nowSec - 7200 : Math.min(startOfDaySec, nowSec - 60);

      const [timeSeries] = await client.listTimeSeries({
        name,
        filter: `metric.type = "${type}"`,
        interval: {
          startTime: { seconds: startTimeSec },
          endTime: { seconds: nowSec },
        },
        aggregation: isGauge
          ? {
              alignmentPeriod: { seconds: 3600 },
              perSeriesAligner: 'ALIGN_MEAN',
            }
          : {
              alignmentPeriod: { seconds: Math.max(60, nowSec - startTimeSec) },
              perSeriesAligner: 'ALIGN_SUM',
            },
      });

      let total = 0;
      for (const ts of timeSeries) {
        for (const point of ts.points || []) {
          const val = point.value?.int64Value || point.value?.doubleValue || 0;
          total += Number(val);
        }
      }
      return total;
    } catch (err: any) {
      console.warn(`[Monitoring] Warning querying ${type}:`, err.message);
      return 0;
    }
  };

  const [readsToday, writesToday, deletesToday, storageBytes] = await Promise.all([
    queryMetric('firestore.googleapis.com/document/read_count'),
    queryMetric('firestore.googleapis.com/document/write_count'),
    queryMetric('firestore.googleapis.com/document/delete_count'),
    queryMetric('firestore.googleapis.com/storage/data_and_index_storage_bytes', true),
  ]);

  const storageGiB = Number((storageBytes / (1024 * 1024 * 1024)).toFixed(4));

  return {
    readsToday,
    writesToday,
    deletesToday,
    storageBytes,
    storageGiB,
    timestamp: new Date().toISOString(),
  };
}
