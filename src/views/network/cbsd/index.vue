<script setup lang="ts">
/**
 * CBSD 管理页面
 *
 * 功能：
 * - CBSD 信息列表 + 编辑弹窗
 * - CBSD 证书管理 Tab
 * - 触发 CBSD 结果任务按钮
 */
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus';
import { Search, Refresh, Edit, Delete, Upload, Promotion } from '@element-plus/icons-vue';

import {
  getCbsdInfoList,
  updateCbsdInfo,
  getCbsdCertificates,
  uploadCbsdCertificate,
  deleteCbsdCertificate,
  triggerCbsdResultTask,
} from '@/api/cbsd';
import type { CbsdInfo, CbsdCertificate, CbsdInfoUpdateParams } from '@/types/cbsd';

const { t } = useI18n();

// ============ 公共 ============
const activeTab = ref('info');

/** 格式化时间 */
function formatTime(time?: string | null): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

// ============ CBSD 信息列表 ============
const infoLoading = ref(false);
const infoData = ref<CbsdInfo[]>([]);
const infoTotal = ref(0);

interface InfoQueryParams {
  page: number;
  pageSize: number;
  elementId: string;
  cbsdId: string;
}
const infoQueryParams = reactive<InfoQueryParams>({
  page: 1,
  pageSize: 20,
  elementId: '',
  cbsdId: '',
});

async function loadCbsdInfoList() {
  infoLoading.value = true;
  try {
    const result = await getCbsdInfoList({
      page: infoQueryParams.page,
      pageSize: infoQueryParams.pageSize,
      elementId: infoQueryParams.elementId ? Number(infoQueryParams.elementId) : undefined,
      cbsdId: infoQueryParams.cbsdId || undefined,
    });
    infoData.value = result.list;
    infoTotal.value = result.total;
  } catch (e) {
    console.error('[CbsdManagement] load info failed:', e);
  } finally {
    infoLoading.value = false;
  }
}

function handleInfoSearch() {
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

function handleInfoReset() {
  infoQueryParams.elementId = '';
  infoQueryParams.cbsdId = '';
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

function handleInfoPageChange(page: number) {
  infoQueryParams.page = page;
  loadCbsdInfoList();
}

function handleInfoSizeChange(size: number) {
  infoQueryParams.pageSize = size;
  infoQueryParams.page = 1;
  loadCbsdInfoList();
}

// 编辑弹窗
const editDialogVisible = ref(false);
const editForm = reactive<CbsdInfoUpdateParams & { id?: number }>({
  id: undefined,
  cbsdId: '',
  fccId: '',
  serialNumber: '',
  latitude: undefined,
  longitude: undefined,
  height: undefined,
  heightType: '',
  antennaGain: undefined,
  cbsdCategory: '',
  status: '',
});

function handleEdit(row: CbsdInfo) {
  editForm.id = row.id;
  editForm.cbsdId = row.cbsdId ?? '';
  editForm.fccId = row.fccId ?? '';
  editForm.serialNumber = row.serialNumber ?? '';
  editForm.latitude = row.latitude ?? undefined;
  editForm.longitude = row.longitude ?? undefined;
  editForm.height = row.height ?? undefined;
  editForm.heightType = row.heightType ?? '';
  editForm.antennaGain = row.antennaGain ?? undefined;
  editForm.cbsdCategory = row.cbsdCategory ?? '';
  editForm.status = row.status ?? '';
  editDialogVisible.value = true;
}

async function handleEditSave() {
  if (!editForm.id) return;
  try {
    const { id, ...data } = editForm;
    await updateCbsdInfo(id, data);
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    loadCbsdInfoList();
  } catch (e) {
    console.error('[CbsdManagement] update failed:', e);
  }
}

// 触发 CBSD 结果任务
const triggering = ref(false);
async function handleTriggerResultTask() {
  try {
    await ElMessageBox.confirm(
      '确定要触发 CBSD 结果任务吗？',
      '触发确认',
      { type: 'info' }
    );
    triggering.value = true;
    await triggerCbsdResultTask();
    ElMessage.success('CBSD 结果任务已触发');
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[CbsdManagement] trigger failed:', e);
    }
  } finally {
    triggering.value = false;
  }
}

// ============ CBSD 证书 ============
const certLoading = ref(false);
const certData = ref<CbsdCertificate[]>([]);
const certUploading = ref(false);

async function loadCertificates() {
  certLoading.value = true;
  try {
    const result = await getCbsdCertificates();
    certData.value = result;
  } catch (e) {
    console.error('[CbsdManagement] load certificates failed:', e);
  } finally {
    certLoading.value = false;
  }
}

async function handleCertUpload(options: { file: File }) {
  certUploading.value = true;
  try {
    await uploadCbsdCertificate(options.file);
    ElMessage.success('证书上传成功');
    loadCertificates();
  } catch (e) {
    console.error('[CbsdManagement] upload certificate failed:', e);
  } finally {
    certUploading.value = false;
  }
}

async function handleCertDelete(row: CbsdCertificate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除证书 "${row.fileName || row.id}" 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await deleteCbsdCertificate(row.id);
    ElMessage.success('删除成功');
    loadCertificates();
  } catch (e) {
    if (e !== 'cancel') {
      console.error('[CbsdManagement] delete certificate failed:', e);
    }
  }
}

// ============ Tab 切换 ============
function handleTabChange(tab: string | number) {
  if (tab === 'info' && infoData.value.length === 0) loadCbsdInfoList();
  else if (tab === 'cert' && certData.value.length === 0) loadCertificates();
}

// ============ 生命周期 ============
onMounted(() => {
  loadCbsdInfoList();
});
</script>

<template>
  <div class="cbsd-management-page">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- Tab1: CBSD 信息 -->
      <el-tab-pane label="CBSD 信息" name="info">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-form :inline="true" @submit.prevent="handleInfoSearch">
            <el-form-item label="设备 ID">
              <el-input
                v-model="infoQueryParams.elementId"
                placeholder="设备 ID"
                clearable
                style="width: 120px"
                @keyup.enter="handleInfoSearch"
              />
            </el-form-item>
            <el-form-item label="CBSD ID">
              <el-input
                v-model="infoQueryParams.cbsdId"
                placeholder="CBSD ID"
                clearable
                style="width: 150px"
                @keyup.enter="handleInfoSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleInfoSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleInfoReset">重置</el-button>
              <el-button
                type="warning"
                :icon="Promotion"
                :loading="triggering"
                @click="handleTriggerResultTask"
              >
                触发结果任务
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="infoLoading" :data="infoData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="elementId" label="设备 ID" width="90" />
            <el-table-column prop="cbsdId" label="CBSD ID" min-width="130" />
            <el-table-column prop="fccId" label="FCC ID" min-width="120" />
            <el-table-column prop="serialNumber" label="序列号" min-width="130" />
            <el-table-column prop="latitude" label="纬度" width="100" />
            <el-table-column prop="longitude" label="经度" width="100" />
            <el-table-column prop="height" label="高度" width="80" />
            <el-table-column prop="heightType" label="高度类型" width="90" />
            <el-table-column prop="antennaGain" label="天线增益" width="90" />
            <el-table-column prop="cbsdCategory" label="类别" width="80" />
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column prop="registrationTime" label="注册时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.registrationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="lastContactTime" label="最后联系" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.lastContactTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row as CbsdInfo)">
                  <Edit /> 编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="infoQueryParams.page"
              v-model:page-size="infoQueryParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="infoTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleInfoSizeChange"
              @current-change="handleInfoPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab2: CBSD 证书 -->
      <el-tab-pane label="CBSD 证书" name="cert">
        <el-card shadow="never" :body-style="{ padding: '16px' }">
          <el-upload
            :show-file-list="false"
            :before-upload="() => false"
            :on-change="(file: UploadFile) => handleCertUpload({ file: (file.raw as File) })"
            accept=".pem,.crt,.cer,.cert"
          >
            <el-button type="success" :icon="Upload" :loading="certUploading">上传证书</el-button>
          </el-upload>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0' }">
          <el-table v-loading="certLoading" :data="certData" stripe border style="width: 100%" row-key="id">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="elementId" label="设备 ID" width="100" />
            <el-table-column prop="fileName" label="文件名" min-width="240" />
            <el-table-column prop="filePath" label="文件路径" min-width="240" />
            <el-table-column prop="uploadTime" label="上传时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.uploadTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleCertDelete(row as CbsdCertificate)">
                  <Delete /> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- CBSD 信息编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑 CBSD" width="600px" @close="editDialogVisible = false">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="CBSD ID">
          <el-input v-model="editForm.cbsdId" placeholder="请输入 CBSD ID" />
        </el-form-item>
        <el-form-item label="FCC ID">
          <el-input v-model="editForm.fccId" placeholder="请输入 FCC ID" />
        </el-form-item>
        <el-form-item label="序列号">
          <el-input v-model="editForm.serialNumber" placeholder="请输入序列号" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="editForm.latitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="editForm.longitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度">
          <el-input-number v-model="editForm.height" :precision="1" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度类型">
          <el-input v-model="editForm.heightType" placeholder="如: AGL / AMSL" />
        </el-form-item>
        <el-form-item label="天线增益">
          <el-input-number v-model="editForm.antennaGain" :precision="1" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类别">
          <el-input v-model="editForm.cbsdCategory" placeholder="如: A / B" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="editForm.status" placeholder="请输入状态" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.cbsd-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>
