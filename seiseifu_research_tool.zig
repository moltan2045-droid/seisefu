const std = @import("std");
const json = std.json;
const fs = std.fs;
const io = std.io;

const Color = struct {
    pub const HEADER = "\x1b[95m";
    pub const BLUE = "\x1b[94m";
    pub const CYAN = "\x1b[96m";
    pub const GREEN = "\x1b[92m";
    pub const WARNING = "\x1b[93m";
    pub const FAIL = "\x1b[91m";
    pub const ENDC = "\x1b[0m";
    pub const BOLD = "\x1b[1m";
};

const Figure = struct {
    name: []const u8,
    faction: []const u8,
    role: []const u8,
};

const Event = struct {
    year: ?u32 = null,
    name: []const u8,
    description: []const u8,
};

const Location = struct {
    name: []const u8,
    terrain: []const u8,
    description: []const u8,
};

const NanbokuchoData = struct {
    title: []const u8,
    figures: []Figure,
    events: []Event,
    key_locations: []Location,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = io.getStdOut().writer();
    const stdin = io.getStdIn().reader();

    try stdout.print("{s}{s}南北朝・征西府 高度研究ツール (Zig版) v1.0{s}\n", .{ Color.BOLD, Color.HEADER, Color.ENDC });

    // データの読み込み
    const file = fs.cwd().openFile("kyushu_nanbokucho_data.json", .{}) catch |err| {
        try stdout.print("{s}データファイルが見つかりません: {any}{s}\n", .{ Color.FAIL, err, Color.ENDC });
        return;
    };
    defer file.close();

    const content = try file.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(content);

    const parsed = try json.parseFromSlice(NanbokuchoData, allocator, content, .{ .ignore_unknown_fields = true });
    defer parsed.deinit();
    const data = parsed.value;

    var buf: [100]u8 = undefined;

    while (true) {
        try stdout.print("\n[1] 検索  [q] 終了\n選択してください > ", .{});
        const input = (try stdin.readUntilDelimiterOrEof(&buf, '\n')) orelse break;
        const choice = std.mem.trim(u8, input, " \r\n");

        if (std.mem.eql(u8, choice, "q")) break;

        if (std.mem.eql(u8, choice, "1")) {
            try stdout.print("検索キーワードを入力 > ", .{});
            const q_input = (try stdin.readUntilDelimiterOrEof(&buf, '\n')) orelse continue;
            const query = std.mem.trim(u8, q_input, " \r\n");

            if (query.len == 0) continue;

            // 人物検索
            var found_fig = false;
            for (data.figures) |fig| {
                if (std.ascii.indexOfIgnoreCase(fig.name, query) != null or
                    std.ascii.indexOfIgnoreCase(fig.role, query) != null) {
                    if (!found_fig) {
                        try stdout.print("\n{s}=== 人物 ==={s}\n", .{ Color.HEADER, Color.ENDC });
                        found_fig = true;
                    }
                    try stdout.print("- {s}{s}{s} ({s}) - {s}\n", .{ Color.CYAN, fig.name, Color.ENDC, fig.role, fig.faction });
                }
            }

            // 事件検索
            var found_event = false;
            for (data.events) |ev| {
                if (std.ascii.indexOfIgnoreCase(ev.name, query) != null or
                    std.ascii.indexOfIgnoreCase(ev.description, query) != null) {
                    if (!found_event) {
                        try stdout.print("\n{s}=== 事件 ==={s}\n", .{ Color.HEADER, Color.ENDC });
                        found_event = true;
                    }
                    const year = if (ev.year) |y| try std.fmt.allocPrint(allocator, "{}", .{y}) else try allocator.dupe(u8, "不明");
                    defer allocator.free(year);
                    try stdout.print("- {s}{s}年: {s}{s}\n", .{ Color.GREEN, year, ev.name, Color.ENDC });
                }
            }

            // 地点検索
            var found_loc = false;
            for (data.key_locations) |loc| {
                if (std.ascii.indexOfIgnoreCase(loc.name, query) != null or
                    std.ascii.indexOfIgnoreCase(loc.description, query) != null) {
                    if (!found_loc) {
                        try stdout.print("\n{s}=== 地点 ==={s}\n", .{ Color.HEADER, Color.ENDC });
                        found_loc = true;
                    }
                    try stdout.print("- {s}{s}{s} ({s})\n", .{ Color.BLUE, loc.name, Color.ENDC, loc.terrain });
                }
            }
        }
    }
}
