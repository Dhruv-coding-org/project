import React from 'react';
import type { GitState } from '../git/gitEngine';

interface GitGraphProps {
  gitState: GitState;
  selectedCommitHash: string | null;
  onSelectCommit: (hash: string | null) => void;
  isGoalView?: boolean;
}

// Visual track colors (emerald, cyan, violet, amber, rose, indigo)
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
  const { commits, branches, headCommitHash, activeBranch } = gitState;

  // 1. Assign tracks to branches (main is always track 0)
  const branchList = Object.keys(branches);
  const sortedBranches = ['main', ...branchList.filter((b) => b !== 'main')];
  const branchTracks: { [name: string]: number } = {};
  sortedBranches.forEach((b, idx) => {
    branchTracks[b] = idx % TRACK_COLORS.length;
  });

  // 2. Compute rows for each commit (Bottom-to-Top layout)
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

  // Evaluate for all commits
  Object.keys(commits).forEach((hash) => {
    getCommitRow(hash);
  });

  // 3. Helper to resolve X track of a commit
  const commitTracks: { [hash: string]: number } = {};
  function getCommitTrack(hash: string): number {
    if (hash in commitTracks) return commitTracks[hash];
    const commit = commits[hash];
    if (!commit) return 0;

    // Direct mapping
    if (commit.branch && branchTracks[commit.branch] !== undefined) {
      commitTracks[hash] = branchTracks[commit.branch];
      return commitTracks[hash];
    }

    // Fallback to parent
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

  // 4. Layout dimensions
  const colWidth = 80;
  const rowHeight = 75;
  const paddingX = 50;
  const paddingY = 80; // top padding for branch tags

  const maxRow = Math.max(...Object.values(commitRows), 0);
  const svgHeight = Math.max(420, maxRow * rowHeight + paddingY + 50);
  const svgWidth = Math.max(350, sortedBranches.length * colWidth + paddingX * 2);

  // Translate (row, track) to SVG coordinates (X, Y)
  // X: columns represent tracks (left to right)
  // Y: rows represent height (Bottom-to-Top, so row 0 is at svgHeight - paddingY)
  const getCoords = (hash: string) => {
    const row = commitRows[hash] ?? 0;
    const track = commitTracks[hash] ?? 0;
    const x = paddingX + track * colWidth;
    const y = svgHeight - paddingY - row * rowHeight;
    return { x, y };
  };

  // 5. Gather all connection links
  const links: { from: string; to: string; fromCoords: { x: number; y: number }; toCoords: { x: number; y: number }; color: string }[] = [];
  Object.keys(commits).forEach((childHash) => {
    const commit = commits[childHash];
    const childCoords = getCoords(childHash);
    const trackIdx = commitTracks[childHash] ?? 0;
    const color = TRACK_COLORS[trackIdx];

    commit.parents.forEach((parentHash) => {
      const parentCoords = getCoords(parentHash);
      links.push({
        from: parentHash,
        to: childHash,
        fromCoords: parentCoords,
        toCoords: childCoords,
        color,
      });
    });
  });

  // 6. Gather tags for each commit (branches and HEAD)
  const commitTags: { [hash: string]: { name: string; type: 'branch' | 'head'; isActive: boolean }[] } = {};
  
  // Branch pointers
  Object.entries(branches).forEach(([bName, b]) => {
    const hash = b.targetHash;
    if (!commitTags[hash]) commitTags[hash] = [];
    commitTags[hash].push({
      name: bName,
      type: 'branch',
      isActive: bName === activeBranch,
    });
  });

  // Detached HEAD pointer
  if (!activeBranch && headCommitHash) {
    if (!commitTags[headCommitHash]) commitTags[headCommitHash] = [];
    commitTags[headCommitHash].push({
      name: 'HEAD',
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

      <div className="graph-canvas-wrapper" style={{ height: '100%', minHeight: '380px' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="git-graph-svg"
          onClick={() => onSelectCommit(null)}
        >
          {/* Glowing Filter definition */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="head-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (vertical tracks) */}
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

          {/* Connection Lines (Bezier Curves) */}
          {links.map((link, idx) => {
            const { x: x1, y: y1 } = link.fromCoords;
            const { x: x2, y: y2 } = link.toCoords;
            
            // Draw S-curve connecting commits
            const cpY1 = (y1 + y2) / 2;
            const cpY2 = (y1 + y2) / 2;
            const pathData = `M ${x1} ${y1} C ${x1} ${cpY1}, ${x2} ${cpY2}, ${x2} ${y2}`;

            return (
              <path
                key={idx}
                d={pathData}
                fill="none"
                stroke={link.color}
                strokeWidth="4"
                className="commit-connection-path"
                strokeDasharray="1000"
                strokeDashoffset="0"
              />
            );
          })}

          {/* Commit Nodes */}
          {Object.keys(commits).map((hash) => {
            const { x, y } = getCoords(hash);
            const trackIdx = commitTracks[hash] ?? 0;
            const nodeColor = TRACK_COLORS[trackIdx];
            const isHead = hash === headCommitHash;
            const isSelected = hash === selectedCommitHash;

            return (
              <g
                key={hash}
                transform={`translate(${x}, ${y})`}
                className={`commit-node-group ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCommit(hash);
                }}
              >
                {/* Outer pulsating ring for current HEAD */}
                {isHead && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="3"
                    className="head-pulse-ring"
                    filter="url(#head-glow)"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={isSelected ? "17" : "15"}
                  fill="#0B0F19"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? "5" : "3.5"}
                  className="commit-node-circle"
                  filter={isSelected || isHead ? "url(#glow)" : undefined}
                />

                {/* Node Hash Text Label */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  className={`commit-node-text ${isHead ? 'head-text' : ''}`}
                  fill={isHead ? "#FFFFFF" : nodeColor}
                >
                  {hash}
                </text>

                {/* Commit Tags (Branches/HEAD labels) next to the node */}
                {commitTags[hash] && (
                  <g transform="translate(24, 0)">
                    {commitTags[hash].map((tag, tagIdx) => {
                      const tagY = tagIdx * 22 - (commitTags[hash].length - 1) * 11;
                      const isTagActive = tag.isActive;
                      
                      // Compute approximate width of tag text
                      const textWidth = tag.name.length * 6.5 + 16;
                      
                      return (
                        <g key={tagIdx} transform={`translate(0, ${tagY})`}>
                          <rect
                            x="0"
                            y="-9"
                            width={textWidth}
                            height="18"
                            rx="4"
                            className={`tag-bg ${tag.type === 'head' ? 'head-tag' : isTagActive ? 'active-branch-tag' : 'inactive-branch-tag'}`}
                            style={{
                              stroke: tag.type === 'head' ? '#F59E0B' : isTagActive ? nodeColor : '#4B5563',
                              fill: tag.type === 'head' ? 'rgba(245, 158, 11, 0.15)' : isTagActive ? `${nodeColor}25` : 'rgba(15, 23, 42, 0.7)',
                            }}
                          />
                          {/* Indicator dot */}
                          <circle
                            cx="7"
                            cy="0"
                            r="3"
                            fill={tag.type === 'head' ? '#F59E0B' : isTagActive ? nodeColor : '#9CA3AF'}
                          />
                          <text
                            x="14"
                            y="1"
                            dy=".3em"
                            className={`tag-text ${isTagActive ? 'active' : ''}`}
                            fill={tag.type === 'head' ? '#F59E0B' : isTagActive ? '#FFFFFF' : '#9CA3AF'}
                          >
                            {tag.name}
                            {isTagActive && tag.type !== 'head' && ' *'}
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
