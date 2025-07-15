export async function writeProjectMeta(projectDir: FileSystemDirectoryHandle, meta: { id:string, name:string, createdAt:string }) {
    const handle = await projectDir.getFileHandle('project.json', { create: true });
    const w = await handle.createWritable();
    await w.write(JSON.stringify(meta, null, 2));
    await w.close();
}