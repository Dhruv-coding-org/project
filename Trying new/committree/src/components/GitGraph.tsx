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
  const colWidth = 85;
  const rowHeight = 80;
  const paddingX = 55;
  const paddingY = 85; // top padding for branch tags

  const maxRow = Math.max(...Object.values(commitRows), 0);
  const svgHeight = Math.max(440, maxRow * rowHeight + paddingY + 60);
  const svgWidth = Math.max(380, sortedBranches.length * colWidth + paddingX * 2);

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
          {/* Glowing Filter definition */}
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
            
            // Draw refined S-curve connecting commits
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

          {/* Commit Nodes */}
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
                {/* Outer pulsating glow ring for current HEAD */}
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

                {/* Rebased Dotted Halo */}
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

                {/* Main Node Circle */}
                <circle
                  r={isSelected ? "18" : "15"}
                  fill="#0B0F19"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? "5.5" : "4"}
                  className="commit-node-circle"
                  filter={isSelected || isHead ? "url(#glow)" : undefined}
                />

                {/* Special Inner Ring for Merge Commits */}
                {isMergeNode && (
                  <circle
                    r="9"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    className="merge-inner-ring"
                  />
                )}

                {/* Node Hash Text Label */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  className={`commit-node-text ${isHead ? 'head-text' : ''}`}
                  fill={isHead ? "#FFFFFF" : nodeColor}
                  style={{ fontWeight: isHead || isSelected ? 'bold' : 'normal' }}
                >
                  {hash}
                </text>

                {/* Commit Tags (Branches/HEAD labels) next to the node */}
                {commitTags[hash] && (
                  <g transform="translate(26, 0)">
                    {commitTags[hash].map((tag, tagIdx) => {
                      const tagY = tagIdx * 24 - (commitTags[hash].length - 1) * 12;
                      const isTagActive = tag.isActive;
                      
                      // Compute approximate width of tag text
                      const textWidth = tag.name.length * 7 + 20;
                      
                      return (
                        <g key={tagIdx} transform={`translate(0, ${tagY})`}>
                          <rect
                            x="0"
                            y="-10"
                            width={textWidth}
                            height="20"
                            rx="5"
                            className={`tag-bg ${tag.type === 'head' ? 'head-tag' : isTagActive ? 'active-branch-tag' : 'inactive-branch-tag'}`}
                            style={{
                              stroke: tag.type === 'head' ? '#F59E0B' : isTagActive ? nodeColor : '#4B5563',
                              strokeWidth: isTagActive || tag.type === 'head' ? '1.5px' : '1px',
                              fill: tag.type === 'head' ? 'rgba(245, 158, 11, 0.2)' : isTagActive ? `${nodeColor}30` : 'rgba(15, 23, 42, 0.85)',
                            }}
                          />
                          {/* Indicator dot */}
                          <circle
                            cx="8"
                            cy="0"
                            r="3.5"
                            fill={tag.type === 'head' ? '#F59E0B' : isTagActive ? nodeColor : '#9CA3AF'}
                          />
                          <text
                            x="16"
                            y="1"
                            dy=".3em"
                            className={`tag-text ${isTagActive ? 'active' : ''}`}
                            fill={tag.type === 'head' ? '#FCD34D' : isTagActive ? '#FFFFFF' : '#D1D5DB'}
                            style={{ fontWeight: isTagActive || tag.type === 'head' ? '600' : '400', fontSize: '11px' }}
                          >
                            {tag.name}
                            {isTagActive && tag.type !== 'head' && ' ★'}
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
