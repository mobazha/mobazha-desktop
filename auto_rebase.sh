#!/bin/bash

# 自动rebase脚本，使用incoming内容解决所有冲突

echo "开始自动rebase，使用incoming内容解决所有冲突..."

while true; do
    # 检查是否有冲突
    if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
        echo "发现冲突，使用incoming内容解决..."
        
        # 使用incoming内容解决所有冲突
        git status --porcelain | grep "^UU\|^AA\|^DD" | awk '{print $2}' | xargs -I {} git checkout --theirs {}
        
        # 添加所有解决的文件
        git add -A
        
        # 继续rebase
        git rebase --continue
    else
        echo "没有更多冲突，rebase完成！"
        break
    fi
done

echo "所有冲突已解决，rebase完成！"
