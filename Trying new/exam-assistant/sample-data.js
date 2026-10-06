// Sample real-world academic exam datasets for quick testing
module.exports = {
  operatingSystems: {
    title: "Operating Systems (CS301 - End Semester Exam)",
    subject: "Operating Systems",
    syllabus: `Unit 1: Introduction to OS and System Calls
- Evolution of Operating Systems, Types of OS (Batch, Time-sharing, Distributed, Real-time)
- System Calls and System Programs, OS Structure (Monolithic, Layered, Microkernel)
- Dual-mode operation (User mode vs Kernel mode)

Unit 2: Process Management and CPU Scheduling
- Process concept, PCB (Process Control Block), Process states and transitions
- Process Scheduling Queues, Schedulers (Long, Short, Medium term), Context Switching
- CPU Scheduling Algorithms: FCFS, SJF (Preemptive & Non-preemptive), Priority, Round Robin (RR)
- Scheduling criteria: Turnaround time, Waiting time, Response time, Throughput

Unit 3: Process Synchronization and Deadlocks
- Critical Section Problem, Race Condition, Requirements for Mutual Exclusion
- Peterson's Solution, Semaphores (Binary & Counting), Classical IPC Problems (Producer-Consumer, Dining Philosophers, Readers-Writers)
- Deadlock characterization (4 necessary conditions), Resource Allocation Graph (RAG)
- Deadlock handling strategies: Prevention, Avoidance (Banker's Algorithm), Detection and Recovery

Unit 4: Memory Management
- Logical vs Physical Address Space, Swapping, Contiguous Memory Allocation (First Fit, Best Fit, Worst Fit)
- Paging: Hardware implementation, Page Table structure, TLB (Translation Lookaside Buffer)
- Segmentation: Basic method, Hardware architecture
- Virtual Memory: Demand Paging, Page Fault handling, Page Replacement Algorithms (FIFO, LRU, Optimal)
- Thrashing: Causes and Working Set Model

Unit 5: Storage and File Systems
- Disk Structure, Disk Scheduling Algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK)
- File Concept, Access Methods (Sequential, Direct), Directory Structure
- File Allocation Methods (Contiguous, Linked, Indexed Allocation)`,
    
    pyqs: `[2024 End-Sem - 10 Marks] Consider the following set of processes with CPU burst times: P1 (8ms), P2 (4ms), P3 (9ms), P4 (5ms) arriving at time 0. Calculate average waiting time and turnaround time for SJF and Round Robin (Quantum = 4ms). Draw Gantt Charts.
[2024 End-Sem - 10 Marks] What is Deadlock? Explain the 4 necessary conditions for deadlock. Solve the Banker's Algorithm safety state for the given allocation and max matrix.
[2024 End-Sem - 5 Marks] Differentiate between Paging and Segmentation with neat diagrams.
[2024 End-Sem - 5 Marks] Explain the concept of Belady's Anomaly. Demonstrate it with FIFO page replacement.
[2024 End-Sem - 5 Marks] Discuss the Dining Philosophers Problem and give a deadlock-free semaphore solution.
[2024 End-Sem - 2 Marks] Define Context Switching and PCB.
[2024 End-Sem - 2 Marks] What is a Microkernel architecture?

[2023 End-Sem - 10 Marks] Explain Demand Paging in detail. Trace the steps involved in handling a Page Fault with a flowchart.
[2023 End-Sem - 10 Marks] Given reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1 with 3 frames. Find page faults using FIFO, LRU, and Optimal algorithms.
[2023 End-Sem - 10 Marks] Explain Peterson's solution for critical section problem. How does it satisfy mutual exclusion, progress, and bounded waiting?
[2023 End-Sem - 5 Marks] Compare SCAN and C-SCAN disk scheduling algorithms with an example.
[2023 End-Sem - 5 Marks] Differentiate between User Level Threads and Kernel Level Threads.
[2023 End-Sem - 2 Marks] What is Thrashing and what causes it?
[2023 End-Sem - 2 Marks] Define Race Condition.

[2022 End-Sem - 10 Marks] State Banker's algorithm for deadlock avoidance. Given Allocation, Max, and Available matrices, determine if the system is in a safe state and show the safe sequence.
[2022 End-Sem - 10 Marks] Compare Preemptive SJF (SRTF) and Round Robin scheduling algorithms with a given process arrival and burst time table.
[2022 End-Sem - 5 Marks] Explain Semaphores. How do binary semaphores solve the Producer-Consumer problem?
[2022 End-Sem - 5 Marks] Explain TLB (Translation Lookaside Buffer) and calculate Effective Memory Access Time (EMAT) formula.
[2022 End-Sem - 5 Marks] Explain Indexed Allocation of disk space with advantages and disadvantages.
[2022 End-Sem - 2 Marks] What are the differences between Monolithic and Layered OS?
[2022 End-Sem - 2 Marks] Define Turnaround Time vs Response Time.

[2021 End-Sem - 10 Marks] Explain LRU and FIFO Page Replacement algorithms with reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 for 3 frames.
[2021 End-Sem - 10 Marks] Explain Deadlock Prevention vs Deadlock Avoidance. Why is Deadlock Prevention difficult to implement in practice?
[2021 End-Sem - 5 Marks] Explain Process State transition diagram in detail with each state's purpose.
[2021 End-Sem - 5 Marks] Explain SSTF and LOOK disk scheduling with seek time calculation.`
  },

  dbms: {
    title: "Database Management Systems (CS302 - Mid/End Sem)",
    subject: "Database Management Systems",
    syllabus: `Unit 1: Introduction and ER Modeling
- Database System Concepts and Architecture, Data Abstraction, Data Independence
- ER Model: Entities, Attributes, Relationships, ER Diagrams, Weak Entity Sets, Extended ER features
- Relational Data Model: Relational schema, Integrity constraints (Primary, Foreign Key, Domain, Referential)

Unit 2: SQL and Relational Algebra
- Relational Algebra operations (Select, Project, Join, Set operations)
- SQL DDL, DML, DCL, Aggregate functions, Nested subqueries, Group By & Having clauses
- Views, Triggers, and Stored Procedures

Unit 3: Normalization and Database Design
- Functional Dependencies, Trivial and Non-trivial dependencies, Closure of attributes
- Normal Forms: 1NF, 2NF, 3NF, BCNF (Boyce-Codd Normal Form)
- Lossless Join Decomposition and Dependency Preserving Decomposition

Unit 4: Transaction Processing and Concurrency Control
- Transaction concept, ACID properties, Transaction states
- Serializability: Conflict and View serializability, Testing for serializability (Precedence Graph)
- Concurrency Control Protocols: Lock-based protocols (2PL, Strict 2PL), Timestamp-based protocols
- Deadlock handling in transactions: Wait-Die, Wound-Wait

Unit 5: Indexing and Storage
- File Organization, Ordered Indices (Primary, Clustering, Secondary index)
- B-Trees and B+ Trees: Search, Insertion, Deletion, Structure comparison
- Hashing: Static vs Dynamic Hashing`,

    pyqs: `[2024 Exam - 10 Marks] What is Normalization? Explain 1NF, 2NF, 3NF, and BCNF with suitable relational examples and functional dependencies.
[2024 Exam - 10 Marks] Explain ACID properties of transactions with real-world examples. What happens if Atomicity or Consistency fails?
[2024 Exam - 10 Marks] Construct a B+ Tree of order 3 for inserting keys: 10, 20, 30, 40, 50, 60, 70, 80. Explain why B+ trees are preferred over B-trees for database indexing.
[2024 Exam - 5 Marks] Explain Two-Phase Locking (2PL) protocol. Differentiate between Strict 2PL and Rigorous 2PL.
[2024 Exam - 5 Marks] Test whether the given schedule S is conflict serializable using a precedence graph: r1(x), r2(y), w1(x), r2(x), w2(y).
[2024 Exam - 5 Marks] Draw an ER diagram for a Hospital Management System showing cardinalities and primary keys.
[2024 Exam - 2 Marks] Define 3-Schema Architecture and Data Independence.

[2023 Exam - 10 Marks] Given Relation R(A, B, C, D, E) with FDs {A->BC, CD->E, B->D, E->A}. Find candidate keys and decompose R into 3NF and BCNF. State if it is lossless.
[2023 Exam - 10 Marks] Explain Conflict Serializability vs View Serializability. How does a precedence graph detect conflict serializability?
[2023 Exam - 5 Marks] Explain BCNF vs 3NF with a counter-example where a relation is in 3NF but not in BCNF.
[2023 Exam - 5 Marks] Explain Deadlock detection and prevention schemes (Wait-Die and Wound-Wait).
[2023 Exam - 2 Marks] What is a Weak Entity Set? How is it represented in an ER diagram?
[2023 Exam - 2 Marks] What is the difference between Primary Index and Secondary Index?`
  }
};
