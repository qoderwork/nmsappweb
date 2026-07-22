<script setup lang="ts">
/**
 * 区域管理
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { http } from '@/utils/request';

const { t } = useI18n();
const loading = ref(false);
const treeData = ref<any[]>([]);
const dialogVisible = ref(false);
const form = reactive({ parentId: 0, name: '', currentNode: null as any });

interface AreaNode {
  id: number;
  p_id: number;
  area_name: string;
  level: number;
  children?: AreaNode[];
}

async function loadTree() {
  loading.value = true;
  try {
    const res = await http.get<AreaNode[]>('/system/areas');
    treeData.value = buildTree(res || []);
  } catch (e) { console.error('[Area] load failed:', e); }
  finally { loading.value = false; }
}

function buildTree(items: AreaNode[]): AreaNode[] {
  const map = new Map<number, AreaNode>();
  const roots: AreaNode[] = [];
  items.forEach(item => { item.children = []; map.set(item.id, item); });
  items.forEach(item => {
    if (item.p_id && map.has(item.p_id)) map.get(item.p_id)!.children!.push(item);
    else roots.push(item);
  });
  return roots;
}

function openAddDialog(parent: any) {
  form.parentId = parent?.id || 0;
  form.name = '';
  form.currentNode = parent;
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) { ElMessage.warning(t('common.required')); return; }
  try {
    await http.post('/system/areas', { area_name: form.name, p_id: form.parentId || null });
    ElMessage.success(t('common.addSuccess'));
    dialogVisible.value = false;
    loadTree();
  } catch (e) { console.error('[Area] save failed:', e); }
}

async function handleUpdate(node: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新名称', '编辑区域', { inputValue: node.area_name });
    if (value) {
      await http.put(`/system/areas/${node.id}`, { area_name: value });
      ElMessage.success(t('common.editSuccess'));
      loadTree();
    }
  } catch (e) { if (e !== 'cancel') console.error('[Area] update failed:', e); }
}

async function handleDelete(node: any) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), { type: 'warning' });
    await http.delete(`/system/areas/${node.id}`);
    ElMessage.success(t('common.deleteSuccess'));
    loadTree();
  } catch (e) { if (e !== 'cancel') console.error('[Area] delete failed:', e); }
}

onMounted(() => loadTree());
</script>

<template>
  <div class="area-page">
    <el-card shadow="never" style="width: 400px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>区域列表</span>
          <el-button size="small" :icon="Plus" @click="openAddDialog(null)">新增</el-button>
        </div>
      </template>
      <el-tree :data="treeData" node-key="id" default-expand-all>
        <template #default="{ node, data }">
          <span class="tree-node">
            <span>{{ data.area_name }}</span>
            <span class="tree-actions">
              <el-button link type="primary" size="small" @click.stop="openAddDialog(data)"><el-icon><Plus /></el-icon></el-button>
              <el-button link type="primary" size="small" @click.stop="handleUpdate(data)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="handleDelete(data)">删除</el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增区域" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item v-if="form.currentNode" label="父区域"><span>{{ form.currentNode.area_name }}</span></el-form-item>
        <el-form-item label="区域名称" required><el-input v-model="form.name" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button><el-button type="primary" @click="handleSave">{{ t('common.confirm') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.area-page { display: flex; gap: var(--spacing-base, 12px); width: 100%; }
.tree-node { flex: 1; display: flex; justify-content: space-between; align-items: center; padding-right: 8px; }
.tree-actions { display: none; }
.tree-node:hover .tree-actions { display: flex; gap: 4px; }
</style>
