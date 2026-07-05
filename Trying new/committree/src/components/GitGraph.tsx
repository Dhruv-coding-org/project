import React from 'react';
import type { GitState } from '../git/gitEngine';

interface GitGraphProps {
  gitState: GitState;
  selectedCommitHash: string | null;
  onSelectCommit: (hash: string | null) => void;
  isGoalView?: boolean;
}

const TRACK_COLORS = [
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#6366F1', // indigo
];

export const GitGraph: React.FC<GitGraphProps> = ({
  gitState,
  selectedCommitHash,
  onSelectCommit,
  isGoalView = false,
}) => {
  const { commits, branches, headCommitHash, activeBranch, tags = {}, remotes = {} } = gitState;

  const branchList = Object.keys(branches);
  const sortedBranches = ['main', ...branchList.filter((b) => b !== 'main')];
  const branchTracks: { [name: string]: number } = {};
  sortedBranches.forEach((b, idx) => {
    branchTracks[b] = idx % TRACK_COLORS.length;
  });

  const commitRows: { [hash: string]: number } = {};
  
  function getCommitRow(hash: string): number {
    if (hash in commitRows) return commitRows[hash];
    const commit = commits[hash];
    if (!commit) return 0;
    if (commit.parents.length === 0) {
      commitRows[hash] = 0;
      return 0;
    }
    const parentRows = commit.parents.map((p) => getCommitRow(p));
    const maxParentRow = Math.max(...parentRows);
    commitRows[hash] = maxParentRow + 1;
    return commitRows[hash];
  }

  Object.keys(commits).forEach((hash) => {
    getCommitRow(hash);
  });

  const commitTracks: { [hash: string]: number } = {};
  function getCommitTrack(hash: string): number {
    if (hash in commitTracks) return commitTracks[hash];
    const commit = commits[hash];
    if (!commit) return 0;

    if (commit.branch && branchTracks[commit.branch] !== undefined) {
      commitTracks[hash] = branchTracks[commit.branch];
      return commitTracks[hash];
    }

    if (commit.parents.length > 0) {
      commitTracks[hash] = getCommitTrack(commit.parents[0]);
      return commitTracks[hash];
    }

    commitTracks[hash] = 0;
    return 0;
  }

  Object.keys(commits).forEach((hash) => {
    getCommitTrack(hash);
  });

  const colWidth = 85;
  const rowHeight = 80;
  const paddingX = 55;
  const paddingY = 85;

  const maxRow = Math.max(...Object.values(commitRows), 0);
  const svgHeight = Math.max(440, maxRow * rowHeight + paddingY + 60);
  const svgWidth = Math.max(420, sortedBranches.length * colWidth + paddingX * 2);

  const getCoords = (hash: string) => {
    const row = commitRows[hash] ?? 0;
    const track = commitTracks[hash] ?? 0;
    const x = paddingX + track * colWidth;
    const y = svgHeight - paddingY - row * rowHeight;
    return { x, y };
  };

  const links: { from: string; to: string; fromCoords: { x: number; y: number }; toCoords: { x: number; y: number }; color: string; isMergeEdge: boolean }[] = [];
  Object.keys(commits).forEach((childHash) => {
    const commit = commits[childHash];
    const childCoords = getCoords(childHash);
    const trackIdx = commitTracks[childHash] ?? 0;
    const color = TRACK_COLORS[trackIdx];

    commit.parents.forEach((parentHash, parentIdx) => {
      const parentCoords = getCoords(parentHash);
      const isMergeEdge = parentIdx > 0 || commit.isMerge;
      links.push({
        from: parentHash,
        to: childHash,
        fromCoords: parentCoords,
        toCoords: childCoords,
        color: isMergeEdge && commit.parents.length > 1 ? '#8B5CF6' : color,
        isMergeEdge,
      });
    });
  });

  const commitTags: { [hash: string]: { name: string; type: 'branch' | 'head' | 'tag' | 'remote'; isActive: boolean }[] } = {};
  
  // Local Branches
  Object.entries(branches).forEach(([bName, b]) => {
    const hash = b.targetHash;
    if (!commitTags[hash]) commitTags[hash] = [];
    commitTags[hash].push({
      name: bName,
      type: 'branch',
      isActive: bName === activeBranch,
    });
  });

  // Remote Tracking Branches
  Object.entries(remotes).forEach(([rName, r]) => {
    const hash = r.targetHash;
    if (!commitTags[hash]) commitTags[hash] = [];
    commitTags[hash].push({
      name: `🌐 ${rName}`,
      type: 'remote',
      isActive: false,
    });
  });

  // Release Tags
  Object.entries(tags).forEach(([tName, hash]) => {
    if (!commitTags[hash]) commitTags[hash] = [];
    commitTags[hash].push({
      name: `🏷️ ${tName}`,
      type: 'tag',
      isActive: false,
    });
  });

  // Detached HEAD pointer
  if (!activeBranch && headCommitHash) {
    if (!commitTags[headCommitHash]) commitTags[headCommitHash] = [];
    commitTags[headCommitHash].push({
      name: 'HEAD (detached)',
      type: 'head',
      isActive: true,
    });
  }

  return (
    <div className={`graph-scroll-container ${isGoalView ? 'goal-view-active' : ''}`}>
      {isGoalView && <div className="goal-overlay-badge">🎯 TARGET GOAL</div>}
      <div className="graph-legend">
        <span className="legend-title">Branches:</span>
        {sortedBranches.map((bName) => (
          <span key={bName} className="legend-item">
            <span
              className="legend-color-dot"
              style={{ backgroundColor: TRACK_COLORS[branchTracks[bName]] }}
            />
            <span className={bName === activeBranch ? 'active-legend-text' : ''}>
              {bName}
              {bName === activeBranch && ' (active)'}
            </span>
          </span>
        ))}
      </div>

      <div className="graph-canvas-wrapper" style={{ height: '100%', minHeight: '400px' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="git-graph-svg"
          onClick={() => onSelectCommit(null)}
        >
          <defs>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="head-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {sortedBranches.map((_, trackIdx) => {
            const x = paddingX + trackIdx * colWidth;
            return (
              <line
                key={trackIdx}
                x1={x}
                y1={0}
                x2={x}
                y2={svgHeight}
                className="track-grid-line"
              />
            );
          })}

          {links.map((link, idx) => {
            const { x: x1, y: y1 } = link.fromCoords;
            const { x: x2, y: y2 } = link.toCoords;
            
            const dy = Math.abs(y2 - y1);
            const cpY1 = y1 - dy * 0.45;
            const cpY2 = y2 + dy * 0.45;
            const pathData = `M ${x1} ${y1} C ${x1} ${cpY1}, ${x2} ${cpY2}, ${x2} ${y2}`;

            return (
              <path
                key={idx}
                d={pathData}
                fill="none"
                stroke={link.color}
                strokeWidth={link.isMergeEdge ? "3.5" : "4.5"}
                className={`commit-connection-path ${link.isMergeEdge ? 'merge-path' : ''}`}
                strokeDasharray={link.isMergeEdge ? "6,4" : "1000"}
              />
            );
          })}

          {Object.keys(commits).map((hash) => {
            const { x, y } = getCoords(hash);
            const commit = commits[hash];
            const trackIdx = commitTracks[hash] ?? 0;
            const nodeColor = TRACK_COLORS[trackIdx];
            const isHead = hash === headCommitHash;
            const isSelected = hash === selectedCommitHash;
            const isMergeNode = commit?.isMerge || (commit?.parents && commit.parents.length > 1);
            const isRebasedNode = commit?.isRebasedCopy || hash.endsWith("'");

            return (
              <g
                key={hash}
                transform={`translate(${x}, ${y})`}
                className={`commit-node-group ${isSelected ? 'selected' : ''} ${isHead ? 'is-head' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCommit(hash);
                }}
              >
                {isHead && (
                  <>
                    <circle
                      r="28"
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      className="head-outer-glow-ring"
                      filter="url(#head-glow)"
                    />
                    <circle
                      r="23"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      className="head-pulse-ring"
                    />
                  </>
                )}

                {isRebasedNode && !isHead && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    className="rebased-halo"
                  />
                )}

                <circle
                  r={isSelected ? "18" : "15"}
                  fill="#0B0F19"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? "5.5" : "4"}
                  className="commit-node-circle"
                  filter={isSelected || isHead ? "url(#glow)" : undefined}
                />

                {isMergeNode && (
                  <circle
                    r="9"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    className="merge-inner-ring"
                  />
                )}

                <text
                  textAnchor="middle"
                  dy=".3em"
                  className={`commit-node-text ${isHead ? 'head-text' : ''}`}
                  fill={isHead ? "#FFFFFF" : nodeColor}
                  style={{ fontWeight: isHead || isSelected ? 'bold' : 'normal' }}
                >
                  {hash}
                </text>

                {commitTags[hash] && (
                  <g transform="translate(26, 0)">
                    {commitTags[hash].map((tag, tagIdx) => {
                      const tagY = tagIdx * 24 - (commitTags[hash].length - 1) * 12;
                      const isTagActive = tag.isActive;
                      const isTagType = tag.type === 'tag';
                      const isRemoteType = tag.type === 'remote';
                      const isHeadType = tag.type === 'head';
                      
                      const textWidth = tag.name.length * 7 + 22;
                      
                      let strokeColor = '#4B5563';
                      let fillColor = 'rgba(15, 23, 42, 0.85)';
                      let textColor = '#D1D5DB';
                      let dotColor = '#9CA3AF';

                      if (isHeadType) {
                        strokeColor = '#F59E0B';
                        fillColor = 'rgba(245, 158, 11, 0.2)';
                        textColor = '#FCD34D';
                        dotColor = '#F59E0B';
                      } else if (isTagType) {
                        strokeColor = '#F59E0B';
                        fillColor = 'rgba(245, 158, 11, 0.15)';
                        textColor = '#FCD34D';
                        dotColor = '#F59E0B';
                      } else if (isRemoteType) {
                        strokeColor = '#8B5CF6';
                        fillColor = 'rgba(139, 92, 246, 0.2)';
                        textColor = '#C4B5FD';
                        dotColor = '#A78BFA';
                      } else if (isTagActive) {
                        strokeColor = nodeColor;
                        fillColor = `${nodeColor}30`;
                        textColor = '#FFFFFF';
                        dotColor = nodeColor;
                      }
                      
                      return (
                        <g key={tagIdx} transform={`translate(0, ${tagY})`}>
                          <rect
                            x="0"
                            y="-10"
                            width={textWidth}
                            height="20"
                            rx="5"
                            className={`tag-bg ${isHeadType ? 'head-tag' : ''}`}
                            style={{
                              stroke: strokeColor,
                              strokeWidth: isTagActive || isHeadType || isTagType || isRemoteType ? '1.5px' : '1px',
                              fill: fillColor,
                            }}
                          />
                          <circle
                            cx="8"
                            cy="0"
                            r="3.5"
                            fill={dotColor}
                          />
                          <text
                            x="16"
                            y="1"
                            dy=".3em"
                            className="tag-text"
                            fill={textColor}
                            style={{ fontWeight: isTagActive || isHeadType || isTagType ? '600' : '400', fontSize: '11px' }}
                          >
                            {tag.name}
                            {isTagActive && !isHeadType && !isTagType && !isRemoteType && ' ★'}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
