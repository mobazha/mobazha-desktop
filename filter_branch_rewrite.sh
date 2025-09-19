#!/bin/bash

# 使用git filter-branch重写历史的脚本
# 将 03dc417cbeec34d7e55053a0f04676615c36ab73 之前的历史合并为初始提交

set -e

TARGET_COMMIT="03dc417cbeec34d7e55053a0f04676615c36ab73"

echo "=== 使用git filter-branch重写历史 ==="
echo "目标：将 $TARGET_COMMIT 之前的历史合并为初始提交"
echo "保留该提交之后的所有提交历史"
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

# 使用git filter-branch重写历史
echo "使用git filter-branch重写历史..."
git filter-branch --force --parent-filter "
    if [ \$GIT_COMMIT = \$(git rev-parse $PARENT_COMMIT) ]; then
        echo \"-p \$(git rev-parse new-init)\"
    else
        cat
    fi
" -- --all

# 切换到main分支并重置
echo "更新main分支..."
git checkout main
git reset --hard new-init

# 清理临时分支
git branch -D new-init

echo ""
echo "=== 重写完成 ==="
echo "备份分支: $BACKUP_BRANCH"
echo "如需回滚: git reset --hard $BACKUP_BRANCH"
echo ""
echo "新的提交历史："
git log --oneline | head -10
echo ""
echo "总提交数："
git log --oneline | wc -l
