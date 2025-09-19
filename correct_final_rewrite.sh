#!/bin/bash

# 正确的最终Git历史重写脚本
# 目标：将 03dc417cbeec34d7e55053a0f04676615c36ab73 之前的历史合并为初始提交
# 保留该提交之后的所有提交历史，确保最终代码与远程一致

set -e

TARGET_COMMIT="03dc417cbeec34d7e55053a0f04676615c36ab73"

echo "=== 正确的最终Git历史重写 ==="
echo "目标：将 $TARGET_COMMIT 之前的历史合并为初始提交"
echo "保留该提交之后的所有提交历史"
echo "确保最终代码与远程一致"
echo ""

# 创建备份
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
echo "创建备份分支: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# 获取目标提交的父提交
PARENT_COMMIT=$(git rev-parse "$TARGET_COMMIT^")
echo "目标提交的父提交: $PARENT_COMMIT"

# 创建新的初始提交
echo "创建新的初始提交..."
git checkout --orphan new-init
git read-tree "$TARGET_COMMIT"
git add -A
git commit -m "Initial commit (consolidated history before $TARGET_COMMIT)"

# 使用git rebase --onto将目标提交之后的所有提交重新应用到新的初始提交之上
echo "重新应用 $TARGET_COMMIT 之后的所有提交到新的初始提交之上..."
echo "这可能需要解决一些冲突，我们将使用incoming的内容..."

# 切换到main分支
git checkout main

# 使用git rebase --onto重写历史
# 这会将 origin/main 上从 TARGET_COMMIT 开始的所有提交应用到 new-init 上
git rebase --onto new-init "$PARENT_COMMIT" origin/main

# 清理临时分支
echo "清理临时分支..."
git branch -D new-init

echo ""
echo "=== 重写完成 ==="
echo "备份分支: $BACKUP_BRANCH"
echo "如需回滚: git reset --hard $BACKUP_BRANCH"
echo ""
echo "新的提交历史：(前10条)"
git log --oneline | head -10
echo ""
echo "总提交数："
git log --oneline | wc -l
