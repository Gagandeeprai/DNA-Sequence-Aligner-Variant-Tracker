#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <chrono>

using namespace std;

const int MATCH = 1;
const int MISMATCH = -1;
const int GAP = -2;

/*
 * DMS Mapping:
 * - Domain: Strings over S = {A, C, G, T}
 * - Function: dp[i][j] (or F(i,j)) gives the optimal global alignment score for prefixes X[1..i] and Y[1..j].
 * 
 * DAA Mapping:
 * - Optimal Substructure: The optimal alignment of length i,j can be derived from i-1,j-1 ; i-1,j ; i,j-1.
 * - Overlapping Subproblems: Computed scores are memoized in the DP table to avoid redundant calculations.
 * 
 * Recurrence Relation:
 * F(0,0) = 0
 * F(i,0) = i * GAP
 * F(0,j) = j * GAP
 * F(i,j) = max(
 *   F(i-1, j-1) + s(x_i, y_j),
 *   F(i-1, j) + GAP,
 *   F(i, j-1) + GAP
 * )
 */

bool isValid(const string& seq) {
    for (char c : seq) {
        if (c != 'A' && c != 'C' && c != 'G' && c != 'T') return false;
    }
    return true;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Usage: " << argv[0] << " <SEQ1> <SEQ2>" << endl;
        return 1;
    }

    string seq1 = argv[1];
    string seq2 = argv[2];

    if (seq1.empty() || seq2.empty()) {
        cerr << "{\"error\": \"Domain Violation: Sequences cannot be empty\"}" << endl;
        return 1;
    }

    if (!isValid(seq1) || !isValid(seq2)) {
        cerr << "{\"error\": \"Domain Violation: Sequences must only contain characters from set S = {A, C, G, T}\"}" << endl;
        return 1;
    }

    int n = seq1.length();
    int m = seq2.length();

    auto start_time = chrono::high_resolution_clock::now();

    // DAA: Space Complexity O(n * m) using DP and direction matrices.
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    vector<vector<char>> dir(n + 1, vector<char>(m + 1, ' '));

    // Base cases
    dp[0][0] = 0;
    dir[0][0] = 'S'; // Start
    
    for (int i = 1; i <= n; i++) {
        dp[i][0] = i * GAP;
        dir[i][0] = 'U';
    }
    for (int j = 1; j <= m; j++) {
        dp[0][j] = j * GAP;
        dir[0][j] = 'L';
    }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            int score_diag = dp[i-1][j-1] + (seq1[i-1] == seq2[j-1] ? MATCH : MISMATCH);
            int score_up = dp[i-1][j] + GAP;
            int score_left = dp[i][j-1] + GAP;

            // Priority: diag > up > left
            // Ensures deterministic optimal alignment when multiple solutions exist
            if (score_diag >= score_up && score_diag >= score_left) {
                dp[i][j] = score_diag;
                dir[i][j] = 'D';
            } else if (score_up >= score_left) {
                dp[i][j] = score_up;
                dir[i][j] = 'U';
            } else {
                dp[i][j] = score_left;
                dir[i][j] = 'L';
            }
        }
    }

    int i = n;
    int j = m;
    string align1 = "";
    string align2 = "";
    
    struct Step {
        int i, j;
        char d;
    };
    vector<Step> path;
    
    struct Mutation {
        string type;
        int pos;
        int aligned_index;
        string detail;
    };
    vector<Mutation> mutations;

    while (i > 0 || j > 0) {
        path.push_back({i, j, dir[i][j]});
        if (dir[i][j] == 'D') {
            align1 = seq1[i-1] + align1;
            align2 = seq2[j-1] + align2;
            string m_type = (seq1[i-1] == seq2[j-1]) ? "match" : "substitution";
            string detail = string(1, seq1[i-1]) + (m_type == "match" ? "" : " -> " + string(1, seq2[j-1]));
            mutations.push_back({m_type, i, -1, detail});
            i--; j--;
        } else if (dir[i][j] == 'U') {
            align1 = seq1[i-1] + align1;
            align2 = "-" + align2;
            mutations.push_back({"deletion", i, -1, string(1, seq1[i-1]) + " -> -"});
            i--;
        } else if (dir[i][j] == 'L') {
            align1 = "-" + align1;
            align2 = seq2[j-1] + align2;
            mutations.push_back({"insertion", i + 1, -1, "- -> " + string(1, seq2[j-1])}); 
            j--;
        }
    }
    path.push_back({0, 0, 'S'});
    reverse(path.begin(), path.end());
    reverse(mutations.begin(), mutations.end());

    for (size_t k = 0; k < mutations.size(); k++) {
        mutations[k].aligned_index = k + 1;
    }

    auto end_time = chrono::high_resolution_clock::now();
    chrono::duration<double, std::milli> compute_duration = end_time - start_time;

    // JSON Output
    cout << "{\n";
    cout << "  \"score\": " << dp[n][m] << ",\n";
    cout << "  \"compute_time_ms\": " << compute_duration.count() << ",\n";
    cout << "  \"seq1_length\": " << n << ",\n";
    cout << "  \"seq2_length\": " << m << ",\n";
    cout << "  \"aligned_seq1\": \"" << align1 << "\",\n";
    cout << "  \"aligned_seq2\": \"" << align2 << "\",\n";
    
    cout << "  \"dp_matrix\": [\n";
    for(int r = 0; r <= n; ++r) {
        cout << "    [";
        for(int c = 0; c <= m; ++c) {
            cout << dp[r][c];
            if (c < m) cout << ", ";
        }
        cout << "]";
        if (r < n) cout << ",";
        cout << "\n";
    }
    cout << "  ],\n";

    cout << "  \"direction_matrix\": [\n";
    for(int r = 0; r <= n; ++r) {
        cout << "    [";
        for(int c = 0; c <= m; ++c) {
            cout << "\"" << dir[r][c] << "\"";
            if (c < m) cout << ", ";
        }
        cout << "]";
        if (r < n) cout << ",";
        cout << "\n";
    }
    cout << "  ],\n";
    
    cout << "  \"traceback_path\": [\n";
    for(size_t p = 0; p < path.size(); ++p) {
        cout << "    [" << path[p].i << ", " << path[p].j << ", \"" << path[p].d << "\"]";
        if (p < path.size() - 1) cout << ",";
        cout << "\n";
    }
    cout << "  ],\n";
    
    cout << "  \"mutations\": [\n";
    for(size_t p = 0; p < mutations.size(); ++p) {
        cout << "    {\n";
        cout << "      \"type\": \"" << mutations[p].type << "\",\n";
        cout << "      \"pos\": " << mutations[p].pos << ",\n";
        cout << "      \"aligned_index\": " << mutations[p].aligned_index << ",\n";
        cout << "      \"detail\": \"" << mutations[p].detail << "\"\n";
        cout << "    }";
        if (p < mutations.size() - 1) cout << ",";
        cout << "\n";
    }
    cout << "  ]\n";
    cout << "}\n";

    return 0;
}
